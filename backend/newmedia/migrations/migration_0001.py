import aiosqlite

from newmedia import store_migration


class Migration0001(store_migration.Migration):
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
