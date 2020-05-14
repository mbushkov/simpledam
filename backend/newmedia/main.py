import argparse
import asyncio
import collections
import logging
import os
import pathlib
import portpicker
import sys
import threading

from typing import cast

from aiohttp import web
import aiohttp
from aiojobs.aiohttp import spawn
import aiojobs.aiohttp

from newmedia import store

PARSER = argparse.ArgumentParser(description='Newmedia backend server.')
PARSER.add_argument("--port", type=int, default=0)
PARSER.add_argument("--db-file", type=pathlib.Path, default=None)

CORS_HEADERS = {
    "Access-Control-Allow-Origin":
        "*",
    "Access-Control-Allow-Methods":
        "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
        "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With",
}


async def RootHandler(request: web.Request) -> web.Response:
  return web.Response(text="ok", content_type="text", headers=CORS_HEADERS)


async def AllowCorsHandler(request: web.Request) -> web.Response:
  return web.Response(headers=CORS_HEADERS)


async def SendWebSocketData(request: web.Request, data):
  coros = [cast(web.WebSocketResponse, ws).send_json(data) for ws in request.app["websockets"]]
  asyncio.gather(*coros)


async def WebSocketHandler(request: web.Request) -> web.WebSocketResponse:
  ws = web.WebSocketResponse(heartbeat=5, compress=False)
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

  request.app["websockets"].remove(ws)

  logging.info("WebSocket connection closed.")
  return ws


SUPPORTED_EXTENSIONS = frozenset([".jpg", ".jpeg", ".tif"])


async def ScanPathHandler(request: web.Request) -> web.Response:
  data = await request.json()
  path: str = data["path"]

  logging.info("Scanning path: %s", path)

  for root, dirs, files in os.walk(path):
    for f in files:
      n, ext = os.path.splitext(f)
      if ext.lower() in SUPPORTED_EXTENSIONS:
        path = str(pathlib.Path(root) / f)
        logging.info("Found path: %s", path)

        image_file = await store.DATA_STORE.RegisterFile(path)
        try:
          await SendWebSocketData(request, {
              "action": "FILE_REGISTERED",
              "image": image_file.ToJSON(),
          })
        except store.ImageProcessingError:
          await SendWebSocketData(request, {
              "action": "FILE_REGISTRATION_FAILED",
              "path": str(path),
          })

        async def Thumbnail(image_file):
          image_file = await store.DATA_STORE.UpdateFileThumbnail(image_file.uid)
          await SendWebSocketData(request, {
              "action": "THUMBNAIL_UPDATED",
              "image": image_file.ToJSON(),
          })

        if not image_file.preview_timestamp:
          await spawn(request, Thumbnail(image_file))

        logging.info("Processing done.")

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


# StdinReadThread keeps reading from stdin. This ensures we're going to
# die if the parent process dies.
def StdinReadThread():
  try:
    while True:
      sys.stdin.read(1024)
  except IOError:
    sys.exit(-1)


def main():
  logging.basicConfig(level=logging.INFO)

  t = threading.Thread(name="stdin_reader", daemon=True, target=StdinReadThread)
  t.start()

  args = PARSER.parse_args()
  store.InitDataStore(args.db_file)

  app = web.Application()
  app.add_routes([
      web.get("/", RootHandler),
      web.get("/ws", WebSocketHandler),
      web.options("/scan-path", AllowCorsHandler),
      web.post("/scan-path", ScanPathHandler),
      web.get("/images/{uid}", GetImageHandler),
  ])
  app["websockets"] = set()
  aiojobs.aiohttp.setup(app)

  port = args.port or portpicker.pick_unused_port()
  sys.stdout.write("%d\n" % port)
  sys.stdout.flush()
  web.run_app(app, host="localhost", port=port)


if __name__ == '__main__':
  main()