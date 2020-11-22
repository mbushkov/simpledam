import logging

from newmedia import backend_state
from newmedia.communicator import Communicator
from newmedia.long_operation import LogMessage, LongOperation, Status


class LongOperationRunner:

  def __init__(self, communicator: Communicator):
    self._communicator = communicator

  async def RunLongOperation(self, operation: LongOperation):
    await backend_state.BACKEND_STATE.SetLongOperationStatus(operation.operation_id,
                                                             Status("Starting...", 0))

    async def LogCallback(log: LogMessage):
      logging.info("[LongOperationRunner] loid: %s, kind: %s, message: %s", operation.operation_id,
                   log.kind, log.message)

    async def StatusCallback(status: Status):
      logging.debug("[LongOperationRunner] loid: %s, status: %s, progress: %.2f",
                    operation.operation_id, status.status, status.progress)
      await backend_state.BACKEND_STATE.SetLongOperationStatus(operation.operation_id, status)

    try:
      await operation.Run(status_callback=StatusCallback, log_callback=LogCallback)
    finally:
      await backend_state.BACKEND_STATE.UnsetLongOperationStatus(operation.operation_id)
