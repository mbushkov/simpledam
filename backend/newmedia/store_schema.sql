CREATE TABLE RendererState (
      id TEXT PRIMARY KEY,
      blob BLOB
    )
CREATE TABLE ImageData (
        uid TEXT PRIMARY KEY,
        path TEXT,
        info BLOB NOT NULL)
CREATE UNIQUE INDEX ImageData_path_index
    ON ImageData(path)
CREATE TABLE ImagePreview (
      uid TEXT NOT NULL,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      blob BLOB
    )
CREATE INDEX ImagePreview_uid
    ON ImagePreview(uid)