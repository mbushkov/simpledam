from typing import Iterable, Optional
import aiosqlite


class Migration:
  async def Migrate(self, conn: aiosqlite.Connection) -> None:
    raise NotImplementedError()

  @property
  def version(self) -> int:
    raise NotImplementedError


async def RunMigrations(conn: aiosqlite.Connection, migrations: Iterable[Migration]):
  migrations = sorted(migrations, key=lambda m: m.version)

  user_version = await conn.execute("PRAGMA user_version")
  version: Optional[int] = None
  async for row in user_version:
    version = row[0]

  assert version is not None

  for m in migrations:
    if version >= m.version:
      continue
    await m.Migrate(conn)
    await conn.executescript(f"PRAGMA user_version = {m.version}")
    await conn.commit()
