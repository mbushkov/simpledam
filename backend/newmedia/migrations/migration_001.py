import aiosqlite

from newmedia.store_migration import Migration


class Migration001(Migration):
  @property
  def version(self) -> int:
    return 1

  async def Migrate(self, conn: aiosqlite.Connection) -> None:
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
