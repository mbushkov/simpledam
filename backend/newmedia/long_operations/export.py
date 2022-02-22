import logging
import pathlib
import shutil

from typing import Collection
from newmedia.long_operation import LogCallback, LongOperation, Status, StatusCallback


class ExportToPathOperation(LongOperation):

  def __init__(self, srcs: Collection[str], dest: str, prefix_with_index: bool):
    super().__init__()
    self.srcs = srcs
    self.dest = dest
    self.prefix_with_index = prefix_with_index

  async def Run(self, status_callback: StatusCallback, log_callback: LogCallback) -> None:
    number_length = max(2, len(str(len(self.srcs))))

    dest_path = pathlib.Path(self.dest)
    for index, src in enumerate(self.srcs):
      src_path = pathlib.Path(src)
      dest_name = src_path.name

      if self.prefix_with_index:
        dest_name = f"{str(index).zfill(number_length)}_{dest_name}"

      logging.info("Copying %s -> %s/%s", src_path, dest_path, dest_name)
      shutil.copy(src_path, dest_path / dest_name, follow_symlinks=True)

      await status_callback(Status(f"Exporting {dest_name}", float(index) / len(self.srcs)))
