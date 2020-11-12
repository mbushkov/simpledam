import argparse
import asyncio
import json
import logging
import os
import pathlib
import shutil
import sys
import uuid
from typing import Awaitable, Callable, Dict, List, Union, cast

import aiohttp
import aiojobs.aiohttp
import portpicker
from aiohttp import web
from aiojobs.aiohttp import spawn
from multidict import istr

from newmedia import backend_state, store

PARSER = argparse.ArgumentParser(description='Newmedia backend server.')
PARSER.add_argument("--port", type=int, default=0)
PARSER.add_argument("--db-file", type=pathlib.Path, default=None)
PARSER.add_argument("--dev", default=False, action='store_true')

CORS_HEADERS: Dict[Union[str, istr], str] = {
    "Access-Control-Allow-Origin":
        "app://.",
    "Access-Control-Allow-Methods":
        "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
        "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-nm-secret",
}


async def RootHandler(request: web.Request) -> web.Response:
  return web.Response(text="ok", content_type="text", headers=CORS_HEADERS)


async def AllowCorsHandler(request: web.Request) -> web.Response:
  return web.Response(headers=CORS_HEADERS)


async def SavedStateHandler(request: web.Request) -> web.Response:
  state = await store.DATA_STORE.GetSavedState()
  return web.json_response({"state": state}, content_type="text", headers=CORS_HEADERS)


async def SendWebSocketData(request: web.Request, data):
  # Remove websockets that were closed abnormally. Chromium will close local
  # websocket connections every time the machine goes to sleep. On the backend
  # side these websockets won't receive any notification, but their close_code
  # property will be set correctly.
  to_remove = set(ws for ws in request.app["websockets"] if ws.close_code is not None)
  if to_remove:
    logging.info("Found %d dead websockets, removing", len(to_remove))
    request.app["websockets"].difference_update(to_remove)

  coros = [
      asyncio.shield(cast(web.WebSocketResponse, ws).send_json(data))
      for ws in request.app["websockets"]
  ]
  asyncio.gather(*coros)


async def WebSocketHandler(request: web.Request) -> web.WebSocketResponse:
  ws = web.WebSocketResponse(compress=False)
  await ws.prepare(request)

  logging.info("Websocket connection opened")
  request.app["websockets"].add(ws)

  async for msg in ws:
    if msg.type == aiohttp.WSMsgType.TEXT:
      logging.info("Got text WebSocket message: %s", msg)
    elif msg.type == aiohttp.WSMsgType.CLOSING:
      logging.info("WebSocket connection is about to close.")
    elif msg.type == aiohttp.WSMsgType.ERROR:
      logging.error('WebSocket connection closed with exception %s' % ws.exception())
    elif msg.type == aiohttp.WSMsgType.CLOSED:
      logging.info("WebSocket connection closed exiting.")
    else:
      logging.info("Message of type: %s %s", msg.type, msg)

  request.app["websockets"].remove(ws)

  logging.info("WebSocket connection closed.")
  return ws


async def ScanFile(path: str, request: web.Request):
  try:
    image_file = await store.DATA_STORE.RegisterFile(pathlib.Path(path))
    await SendWebSocketData(request, {
        "action": "FILE_REGISTERED",
        "image": image_file.ToJSON(),
    })
  except store.ImageProcessingError:
    await SendWebSocketData(request, {
        "action": "FILE_REGISTRATION_FAILED",
        "path": str(path),
    })
    return

  async def Thumbnail(image_file):
    try:
      thumbnail_file = await store.DATA_STORE.UpdateFileThumbnail(image_file.uid)
    finally:
      backend_state.BACKEND_STATE.ChangePreviewQueueSize(-1)

    await SendWebSocketData(request, {
        "action": "THUMBNAIL_UPDATED",
        "image": thumbnail_file.ToJSON(),
    })

  if not image_file.preview_timestamp:
    backend_state.BACKEND_STATE.ChangePreviewQueueSize(1)
    await spawn(request, Thumbnail(image_file))


async def ScanPathHandler(request: web.Request) -> web.Response:
  data = await request.json()
  path: str = data["path"]

  logging.info("Scanning path: %s", path)

  if os.path.isdir(path):
    for root, dirs, files in os.walk(path):
      for f in files:
        n, ext = os.path.splitext(f)
        if ext.lower() in store.SUPPORTED_EXTENSIONS:
          path = str(pathlib.Path(root) / f)
          logging.info("Found path: %s", path)
          await ScanFile(path, request)
          logging.info("Processing done.")
  elif os.path.isfile(path):
    logging.info("Scan file: %s", path)
    await ScanFile(path, request)

  return web.Response(text="ok", content_type="text", headers=CORS_HEADERS)


async def MovePathHandler(request: web.Request) -> web.Response:
  data = await request.json()
  src: str = data["src"]
  dest: str = data["dest"]

  try:
    image_file = await store.DATA_STORE.MoveFile(pathlib.Path(src), pathlib.Path(dest))
    await SendWebSocketData(request, {
        "action": "FILE_REGISTERED",
        "image": image_file.ToJSON(),
    })

    return web.Response(text="ok", content_type="text", headers=CORS_HEADERS)
  except store.Error as e:
    return web.Response(status=520,
                        text=f"{e.__class__.__name__}:{str(e)}",
                        content_type="text",
                        headers=CORS_HEADERS)


async def ExportToPathHandler(request: web.Request) -> web.Response:
  data = await request.json()

  srcs: List[str] = data["srcs"]
  dest: str = data["dest"]
  prefix_with_index: bool = data["options"]["prefix_with_index"]

  number_length = max(2, len(str(len(srcs))))

  dest_path = pathlib.Path(dest)
  for index, src in enumerate(srcs):
    src_path = pathlib.Path(src)
    dest_name = src_path.name

    if prefix_with_index:
      dest_name = f"{str(index).zfill(number_length)}_{dest_name}"
    logging.info("Copying %s -> %s/%s", src_path, dest_path, dest_name)
    shutil.copy(src_path, dest_path / dest_name, follow_symlinks=True)

  return web.Response(status=200, text="ok", headers=CORS_HEADERS)


_CHUNK_LENGTH = 1048576


async def GetImageHandler(request: web.Request) -> web.StreamResponse:
  uid = request.match_info.get("uid")
  io_stream = await store.DATA_STORE.ReadFileBlob(uid)

  try:
    headers = dict(CORS_HEADERS.items())
    headers["Content-Type"] = "image/jpeg"

    response = web.StreamResponse(headers=headers)
    await response.prepare(request)
    while True:
      chunk = io_stream.read(_CHUNK_LENGTH)
      await response.write(chunk)
      if len(chunk) < _CHUNK_LENGTH:
        break
  finally:
    io_stream.close()

  await response.write_eof()

  return response


async def SaveHandler(request: web.Request) -> web.Response:
  data = await request.json()
  path: str = data["path"]
  state = data["state"]

  logging.info("Saving to: %s", path)

  await store.DATA_STORE.SaveStore(path, state)

  return web.Response(text="ok", content_type="text", headers=CORS_HEADERS)


async def DieIfParentDies():
  ppid = os.getppid()
  logging.info("Parent pid %d", ppid)
  while True:
    try:
      os.kill(ppid, 0)
    except OSError:
      logging.info("Parent process died, exiting...")
      sys.exit(0)

    await asyncio.sleep(1)


def SecretCheckWrapper(
    fn: Callable[[web.Request], Awaitable[web.Response]]
) -> Callable[[web.Request], Awaitable[web.Response]]:

  async def Wrapped(request: web.Request) -> web.Response:
    if request.headers["X-nm-secret"] != request.app["secret"]:
      return web.Response(status=403, text="Secret check failed.")

    return await fn(request)

  return Wrapped


def main():
  logging.basicConfig(level=logging.INFO)

  args = PARSER.parse_args()

  if args.dev:
    CORS_HEADERS["Access-Control-Allow-Origin"] = "http://localhost:8080"

  store.InitDataStore(args.db_file)

  # TODO: max request size is 1 Gb. This creates a natural
  # limit on the library size. We should look into how to
  # do streaming updates.
  app = web.Application(client_max_size=1024 * 1024 * 1024)
  app.add_routes([
      web.get("/", RootHandler),
      web.get("/ws", WebSocketHandler),
      web.options("/saved-state", AllowCorsHandler),
      web.get("/saved-state", SecretCheckWrapper(SavedStateHandler)),
      web.options("/scan-path", AllowCorsHandler),
      web.post("/scan-path", SecretCheckWrapper(ScanPathHandler)),
      web.options("/save", AllowCorsHandler),
      web.post("/save", SecretCheckWrapper(SaveHandler)),
      web.options("/move-path", AllowCorsHandler),
      web.post("/move-path", SecretCheckWrapper(MovePathHandler)),
      web.options("/export-to-path", AllowCorsHandler),
      web.post("/export-to-path", SecretCheckWrapper(ExportToPathHandler)),
      web.get("/images/{uid}", GetImageHandler),
  ])
  app["websockets"] = set()
  aiojobs.aiohttp.setup(app)

  # Die if the parent process dies.
  asyncio.get_event_loop().create_task(DieIfParentDies())

  backend_state.BACKEND_STATE = backend_state.BackendState(app)

  port = args.port or portpicker.pick_unused_port()
  secret = uuid.uuid4().hex
  app["secret"] = secret

  sys.stdout.write(json.dumps(dict(port=port, secret=secret)) + "\n")
  sys.stdout.flush()

  web.run_app(app, host="127.0.0.1", port=port, handle_signals=True)


if __name__ == '__main__':
  main()
