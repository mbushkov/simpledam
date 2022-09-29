import aiosqlite
import bson

from newmedia import store_migration
from newmedia.schemas import schema_0001
from newmedia.schemas import schema_0002


class Migration0002(store_migration.Migration):
  @property
  def version(self) -> int:
    return 2

  async def Migrate(self, conn: aiosqlite.Connection) -> None:
    await conn.executescript("""
    CREATE TABLE ImagePreview (
      uid TEXT NOT NULL,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      blob BLOB
    );

    CREATE INDEX ImagePreview_uid
    ON ImagePreview(uid);
    """)

    async with conn.execute("SELECT uid, info, blob FROM ImageData") as cursor:
      async for row in cursor:
        uid = row[0]
        prev_info = schema_0001.ImageFile.FromJSON(bson.loads(row[1]))
        prev_blob = row[2]
        new_info = schema_0002.ImageFile.FromV1(prev_info)
        serialized = bson.dumps(new_info.ToJSON())

        await conn.execute_insert("UPDATE ImageData SET info = ? WHERE uid = ?", (uid, serialized))
        if prev_info.preview_size:
          await conn.execute_insert("INSERT OR REPLACE INTO ImagePreview(uid, width, height, blob) VALUES(?, ?, ?, ?)", (uid, prev_info.preview_size.width, prev_info.preview_size.height, prev_blob))
        await conn.commit()

    await conn.executescript("""
    ALTER TABLE ImageData DROP COLUMN blob;
    """)
    await conn.commit()
