import argparse
import asyncio
import logging
import os
import pathlib

from aiohttp import web
import aiohttp

from newmedia import store

PARSER = argparse.ArgumentParser(description='Newmedia backend server.')
PARSER.add_argument("--port", type=int, default=30000)

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


WEB_SOCKET_UPDATE_QUEUE = asyncio.Queue()


async def WebSocketHandler(request: web.Request) -> web.WebSocketResponse:
  ws = web.WebSocketResponse()
  await ws.prepare(request)

  async def QueueLoop():
    while True:
      item = await WEB_SOCKET_UPDATE_QUEUE.get()
      await ws.send_json(item)

  async def ReceiveLoop():
    async for msg in ws:
      if msg.type == aiohttp.WSMsgType.TEXT:
        logging.info("Got text WebSocket message: %s", msg)
      elif msg.type == aiohttp.WSMsgType.CLOSING:
        logging.info("WebSocket connection is about to close.")
      elif msg.type == aiohttp.WSMsgType.ERROR:
        logging.error('WebSocket connection closed with exception %s' % ws.exception())

  done, pending = await asyncio.wait(
      [
          asyncio.create_task(QueueLoop()),
          asyncio.create_task(ReceiveLoop()),
      ],
      return_when=asyncio.FIRST_COMPLETED,
  )
  for p in pending:
    p.cancel()

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
        path = pathlib.Path(root) / f
        logging.info("Found path: %s", path)

        try:
          image_file = await store.DATA_STORE.RegisterFile(path)
          await WEB_SOCKET_UPDATE_QUEUE.put({
              "action": "FILE_REGISTERED",
              "image": image_file.JsonSummary(),
          })
        except store.ImageProcessingError:
          await WEB_SOCKET_UPDATE_QUEUE.put({
              "action": "FILE_REGISTRATION_FAILED",
              "path": str(path),
          })

        logging.info("Processing done.")

  return web.Response(text="ok", content_type="text", headers=CORS_HEADERS)


_CHUNK_LENGTH = 1048576


async def GetImageHandler(request: web.Request) -> web.StreamResponse:
  uid = request.match_info.get("uid")
  io_stream = await store.DATA_STORE.ReadFile(uid)

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


def main():
  logging.basicConfig(level=logging.INFO)

  args = PARSER.parse_args()

  app = web.Application()
  app.add_routes([
      web.get("/", RootHandler),
      web.get("/ws", WebSocketHandler),
      web.options("/scan-path", AllowCorsHandler),
      web.post("/scan-path", ScanPathHandler),
      web.get("/images/{uid}", GetImageHandler),
  ])
  web.run_app(app, host="localhost", port=args.port)


if __name__ == '__main__':
  main()