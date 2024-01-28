import os
from unittest import mock

from newmedia import backend_state
from newmedia import store

import pytest

from newmedia import communicator


@pytest.mark.asyncio
@mock.patch.object(
    backend_state,
    "BACKEND_STATE",
    backend_state.BackendState(communicator.CommunicatorStub()),
    create=True)
async def test_SchemaIsUpToDate():
  with open(os.path.join(os.path.dirname(__file__), "store_schema.sql"), "r", encoding="utf-8") as fd:
    expected_schema = fd.read()

  db = store.DataStore()
  try:
    schema = await db.GetSchema()
    try:
      assert schema == expected_schema
    except AssertionError:
      print(schema)
  finally:
    # TODO: use better resource celanup strategy in tests.
    await db.Close()
