import argparse
import asyncio
import json
import logging
import os
import pathlib
import sys
import uuid
from typing import Awaitable, Callable, Dict, List, Union, cast

import aiojobs.aiohttp
from newmedia.communicator import Communicator
from newmedia.long_operation_runner import LongOperationRunner
from newmedia.long_operations.export import ExportToPathOperation
from newmedia.long_operations.save import SaveOperation
from newmedia.long_operations.scan import ScanPathsOperation
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


async def WebSocketHandler(request: web.Request) -> web.WebSocketResponse:
  ws = web.WebSocketResponse(compress=False)
  await ws.prepare(request)

  communicator = cast(Communicator, request.app["communicator"])
  await communicator.ListenToWebSocket(ws)

  return ws


async def ScanPathHandler(request: web.Request) -> web.Response:
  data = await request.json()
  path: str = data["path"]

  communicator = cast(Communicator, request.app["communicator"])
  long_operation_runnter = cast(LongOperationRunner, request.app["long_operation_runner"])

  await spawn(request,
              long_operation_runnter.RunLongOperation(ScanPathsOperation([path], communicator)))

  return web.Response(text="ok", content_type="text", headers=CORS_HEADERS)


async def MovePathHandler(request: web.Request) -> web.Response:
  data = await request.json()
  src: str = data["src"]
  dest: str = data["dest"]

  communicator = cast(Communicator, request.app["communicator"])

  try:
    image_file = await store.DATA_STORE.MoveFile(pathlib.Path(src), pathlib.Path(dest))
    await communicator.SendWebSocketData({
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

  long_operation_runnter = cast(LongOperationRunner, request.app["long_operation_runner"])

  await spawn(
      request,
      long_operation_runnter.RunLongOperation(ExportToPathOperation(srcs, dest, prefix_with_index)))

  return web.Response(text="ok", content_type="text", headers=CORS_HEADERS)


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

  long_operation_runnter = cast(LongOperationRunner, request.app["long_operation_runner"])

  await spawn(request, long_operation_runnter.RunLongOperation(SaveOperation(state, path)))

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

  communicator = Communicator()
  long_operation_runner = LongOperationRunner(communicator)

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
  app["communicator"] = communicator
  app["long_operation_runner"] = long_operation_runner
  aiojobs.aiohttp.setup(app)

  # Die if the parent process dies.
  asyncio.get_event_loop().create_task(DieIfParentDies())

  backend_state.BACKEND_STATE = backend_state.BackendState(communicator)

  port = args.port or portpicker.pick_unused_port()
  secret = uuid.uuid4().hex
  app["secret"] = secret

  sys.stdout.write(json.dumps(dict(port=port, secret=secret)) + "\n")
  sys.stdout.flush()

  web.run_app(app, host="127.0.0.1", port=port, handle_signals=True)


if __name__ == '__main__':
  main()
