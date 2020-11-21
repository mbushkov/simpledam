from newmedia import backend_state
from newmedia.communicator import Communicator
from newmedia.long_operation import LongOperation, LongOperationStatus


class LongOperationRunner:

  def __init__(self, communicator: Communicator):
    self._communicator = communicator

  async def RunLongOperation(self, operation: LongOperation):
    await backend_state.BACKEND_STATE.SetLongOperationStatus(operation.operation_id,
                                                             LongOperationStatus("Starting...", 0))

    try:
      async for status in operation.Run():
        await backend_state.BACKEND_STATE.SetLongOperationStatus(operation.operation_id, status)

    finally:
      await backend_state.BACKEND_STATE.UnsetLongOperationStatus(operation.operation_id)
