import aiosqlite


async def Migrate(conn: aiosqlite.Connection) -> bool:
  user_version = await conn.execute("PRAGMA user_version")
  async for row in user_version:
    if row[0] > 0:
      return False

  await conn.executescript("""
  CREATE TABLE IF NOT EXISTS RendererState (
    id TEXT PRIMARY KEY,
    blob BLOB
  );

  CREATE TABLE IF NOT EXISTS ImageData (
      uid TEXT PRIMARY KEY,
      path TEXT,
      info BLOB NOT NULL,
      blob BLOB
  );

  CREATE UNIQUE INDEX IF NOT EXISTS ImageData_path_index
  ON ImageData(path);
  """)
  await conn.commit()

  return True
