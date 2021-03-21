from typing import Any, List, Mapping, Protocol, Union, runtime_checkable

# Possible JSON Values
JSON_v = Union[str, int, float, bool, None]

# If MyPy ever permits recursive definitions, just uncomment this:
# JSON = Dict[str, Union[JSON_v, Mapping[str, "JSON"], List["JSON"]]]

# Until then, here's a multi-layer way to represent any (reasonable) JSON we
# might send or receive.  It terminates at JSON_4, so the maximum depth of
# the JSON is 5 keys/lists.

JSON_4 = Mapping[str, Union[JSON_v, Mapping[str, JSON_v], List[JSON_v]]]
JSON_3 = Mapping[str, Union[JSON_v, Mapping[str, Union[JSON_v, JSON_4]], List[JSON_4]]]
JSON_2 = Mapping[str, Union[JSON_v, Mapping[str, Union[JSON_v, JSON_3]], List[JSON_3]]]
JSON_1 = Mapping[str, Union[JSON_v, Mapping[str, Union[JSON_v, JSON_2]], List[JSON_2]]]
JSON = Mapping[str, Union[JSON_v, Mapping[str, Union[JSON_v, JSON_1]], List[JSON_1]]]

# To allow deeper nesting, you can of course expand the JSON definition above,
# or you can keep typechecking for the first levels but skip typechecking
# at the deepest levels by using UnsafeJSON:

UnsafeJSON_4 = Mapping[str, Union[JSON_v, Mapping[str, Any], List[Any]]]
UnsafeJSON_3 = Mapping[str, Union[JSON_v, Mapping[str, Union[JSON_v, UnsafeJSON_4]],
                                  List[UnsafeJSON_4]]]
UnsafeJSON_2 = Mapping[str, Union[JSON_v, Mapping[str, Union[JSON_v, UnsafeJSON_3]],
                                  List[UnsafeJSON_3]]]
UnsafeJSON_1 = Mapping[str, Union[JSON_v, Mapping[str, Union[JSON_v, UnsafeJSON_2]],
                                  List[UnsafeJSON_2]]]
UnsafeJSON = Mapping[str, Union[JSON_v, Mapping[str, Union[JSON_v, UnsafeJSON_1]],
                                List[UnsafeJSON_1]]]


@runtime_checkable
class ToJSONProtocol(Protocol):

  def ToJSON(self) -> JSON:
    ...