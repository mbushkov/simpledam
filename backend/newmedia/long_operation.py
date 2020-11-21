import abc
import dataclasses
import uuid
from typing import AsyncIterator


@dataclasses.dataclass
class LongOperationStatus:
  status: str
  progress: float

  def ToJSON(self):
    return dataclasses.asdict(self)


class LongOperation(metaclass=abc.ABCMeta):

  def __init__(self):
    self.operation_id = uuid.uuid4().hex

  @abc.abstractmethod
  async def Run(self) -> AsyncIterator[LongOperationStatus]:
    yield LongOperationStatus("", 0)  # to make mypy happy
    raise NotImplementedError()
