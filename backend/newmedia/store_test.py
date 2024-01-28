import os
from unittest import mock

from newmedia import backend_state
from newmedia import store

import pytest
import pytest_asyncio

from newmedia import communicator


@pytest_asyncio.fixture
async def db():
  db = store.DataStore()
  try:
    yield db
  finally:
    await db.Close()


@pytest.mark.asyncio
@mock.patch.object(
    backend_state,
    "BACKEND_STATE",
    backend_state.BackendState(communicator.CommunicatorStub()),
    create=True)
async def test_SchemaIsUpToDate(db: store.DataStore):
  with open(os.path.join(os.path.dirname(__file__), "store_schema.sql"), "r", encoding="utf-8") as fd:
    expected_schema = fd.read()

  schema = await db.GetSchema()
  try:
    assert schema == expected_schema
  except AssertionError:
    print(schema)
