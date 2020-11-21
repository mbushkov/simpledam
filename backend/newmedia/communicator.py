import asyncio
import logging
from typing import Set, Union

from aiohttp import web, WSMsgType
from aiohttp.web_ws import WebSocketResponse
from newmedia.utils.json_type import JSON, ToJSONProtocol


class Communicator:

  def __init__(self):
    self._websockets: Set[web.WebSocketResponse] = set()

  async def ListenToWebSocket(self, ws: WebSocketResponse):
    logging.info("Websocket connection opened")
    self._websockets.add(ws)

    async for msg in ws:
      if msg.type == WSMsgType.TEXT:
        logging.info("Got text WebSocket message: %s", msg)
      elif msg.type == WSMsgType.CLOSING:
        logging.info("WebSocket connection is about to close.")
      elif msg.type == WSMsgType.ERROR:
        logging.error('WebSocket connection closed with exception %s' % ws.exception())
      elif msg.type == WSMsgType.CLOSED:
        logging.info("WebSocket connection closed exiting.")
      else:
        logging.info("Message of type: %s %s", msg.type, msg)

    self._websockets.remove(ws)

    logging.info("WebSocket connection closed.")

  async def SendWebSocketData(self, data: Union[JSON, ToJSONProtocol]):
    # Remove websockets that were closed abnormally. Chromium will close local
    # websocket connections every time the machine goes to sleep. On the backend
    # side these websockets won't receive any notification, but their close_code
    # property will be set correctly.
    json_data: JSON
    if isinstance(data, ToJSONProtocol):
      json_data = data.ToJSON()
    else:
      json_data = data

    to_remove = set(ws for ws in self._websockets if ws.close_code is not None)
    if to_remove:
      logging.info("Found %d dead websockets, removing", len(to_remove))
      self._websockets.difference_update(to_remove)

    coros = [asyncio.shield(ws.send_json(json_data)) for ws in self._websockets]
    asyncio.gather(*coros)
