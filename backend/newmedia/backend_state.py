from typing import Dict

from newmedia.communicator import Communicator
from newmedia.long_operation import LongOperationStatus


class BackendState:

  async def _SendUpdate(self):
    await self._communicator.SendWebSocketData({
        "action": "BACKEND_STATE_UPDATE",
        "state": self._ToJSON(),
    })

  def _ToJSON(self):
    long_operations = {}
    for k, v in self._long_operations.items():
      long_operations[k] = v.ToJSON()

    return {
        "catalogPath": self._catalog_path,
        "previewQueueSize": self._preview_queue_size,
        "longOperations": long_operations,
    }

  def __init__(self, communicator: Communicator):
    self._catalog_path: str = ""
    self._preview_queue_size: int = 0
    self._long_operations: Dict[str, LongOperationStatus] = {}

    self._communicator = communicator

  @property
  def catalog_path(self) -> str:
    return self._catalog_path

  async def ChangeCatalogPath(self, value: str):
    self._catalog_path = value
    await self._SendUpdate()

  @property
  def preview_queue_size(self) -> int:
    return self._preview_queue_size

  async def ChangePreviewQueueSize(self, delta: int):
    self._preview_queue_size += delta
    await self._SendUpdate()

  async def SetLongOperationStatus(self, oid: str, status: LongOperationStatus):
    self._long_operations[oid] = status
    await self._SendUpdate()

  async def UnsetLongOperationStatus(self, oid: str):
    del self._long_operations[oid]
    await self._SendUpdate()


BACKEND_STATE: BackendState
