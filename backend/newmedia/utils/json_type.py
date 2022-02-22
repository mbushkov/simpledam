from typing import List, Mapping, Protocol, Union, runtime_checkable

JSON_v = Union[str, int, float, bool, None]
JSON = Mapping[str, Union[JSON_v, "JSON", List["JSON"]]]


@runtime_checkable
class ToJSONProtocol(Protocol):

  def ToJSON(self) -> JSON:
    ...
