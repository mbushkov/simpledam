import asyncio
from typing import cast, Optional

from aiohttp import web


class BackendState:

  def __init__(self, app):
    self._catalog_path: str = ""
    self._preview_queue_size: int = 0
    self._catalog_op_name: Optional[str] = None
    self._catalog_op_progress: Optional[int] = None
    self._app = app

  @property
  def catalog_path(self) -> str:
    return self._catalog_path

  @catalog_path.setter
  def catalog_path(self, value: str):
    self._catalog_path = value
    self._SendUpdate()

  @property
  def preview_queue_size(self) -> int:
    return self._preview_queue_size

  def ChangePreviewQueueSize(self, delta: int):
    self._preview_queue_size += delta
    self._SendUpdate()

  def SetCatalogOpProgress(self, name: Optional[str], progress: Optional[int]):
    self._catalog_op_name = name
    self._catalog_op_progress = progress

  def _ToJSON(self):
    return {
        "catalogPath": self._catalog_path,
        "previewQueueSize": self._preview_queue_size,
        "catalogOpName": self._catalog_op_name,
        "catalogOpProgress": self._catalog_op_progress,
    }

  def _SendUpdate(self):
    coros = [
        cast(web.WebSocketResponse, ws).send_json({
            "action": "BACKEND_STATE_UPDATE",
            "state": self._ToJSON(),
        }) for ws in self._app["websockets"]
    ]
    asyncio.gather(*coros)


BACKEND_STATE = None