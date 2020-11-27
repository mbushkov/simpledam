import logging
from typing import Dict

from newmedia.communicator import Communicator
from newmedia.long_operation import LogMessage, LongOperation, Status


class LongOperationRunner:

  def __init__(self, communicator: Communicator):
    self._communicator = communicator
    self._in_progress: Dict[str, LongOperation] = {}

  async def _RunLongOperation(self, operation: LongOperation):
    await self._communicator.SendWebSocketData({
        "action": "LONG_OPERATION_START",
        "loid": operation.operation_id
    })

    async def LogCallback(log: LogMessage):
      logging.info("[LongOperationRunner] loid: %s, kind: %s, message: %s", operation.operation_id,
                   log.kind, log.message)
      await self._communicator.SendWebSocketData({
          "loid": operation.operation_id,
          "action": "LONG_OPERATION_LOG",
          "log": log.ToJSON(),
      })

    async def StatusCallback(status: Status):
      logging.debug("[LongOperationRunner] loid: %s, status: %s, progress: %.2f",
                    operation.operation_id, status.status, status.progress)
      await self._communicator.SendWebSocketData({
          "loid": operation.operation_id,
          "action": "LONG_OPERATION_STATUS",
          "status": status.ToJSON(),
      })

    try:
      await operation.Run(status_callback=StatusCallback, log_callback=LogCallback)

      await self._communicator.SendWebSocketData({
          "action": "LONG_OPERATION_SUCCESS",
          "loid": operation.operation_id,
      })
    except Exception as e:
      logging.exception("Exception during long running operation %s: %s", operation, e)
      await self._communicator.SendWebSocketData({
          "action": "LONG_OPERATION_ERROR",
          "loid": operation.operation_id,
          "message": str(e),
      })

  async def RunLongOperation(self, operation: LongOperation):
    self._in_progress[operation.operation_id] = operation
    try:
      await self._RunLongOperation(operation)
    finally:
      del self._in_progress[operation.operation_id]