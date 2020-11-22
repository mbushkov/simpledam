import abc
import dataclasses
import enum
import uuid
from typing import AsyncIterator, Awaitable, Callable, Union

from typing_extensions import Literal


@dataclasses.dataclass
class Status:
  status: str
  progress: float

  def ToJSON(self):
    return dataclasses.asdict(self)


@dataclasses.dataclass
class LogMessage:

  class Kind(enum.Enum):
    LOG = "log"
    WARNING = "warning"
    ERROR = "error"

  kind: Kind
  message: str

  def ToJSON(self):
    return dict(kind=self.kind.value, message=self.message)


StatusCallback = Callable[[Status], Awaitable[None]]
LogCallback = Callable[[LogMessage], Awaitable[None]]


class LongOperation(metaclass=abc.ABCMeta):

  def __init__(self):
    self.operation_id = uuid.uuid4().hex

  @abc.abstractmethod
  async def Run(self, status_callback: StatusCallback, log_callback: LogCallback) -> None:
    raise NotImplementedError()
