import os
import pathlib
import pytest

from newmedia import image_processor, store_schema


@pytest.mark.asyncio
async def test_JPEGExifDataIsCorrectlyRead():
  im_path = pathlib.Path(os.path.dirname(__file__)) / "test_data/jpeg_with_exif.jpeg"

  p = image_processor.ImageProcessor()
  info, _ = await p.GetFileInfo(im_path, None)
  assert info.exif_data == store_schema.ExifData(
      make="Canon",
      model="Canon EOS 40D",
      orientation=1,
      x_resolution=72.0,
      y_resolution=72.0,
      resolution_unit=2,
      software="GIMP 2.4.5",
      datetime="2008:07:31 10:38:11")


@pytest.mark.asyncio
async def test_TIFFExifDataIsCorrectlyRead():
  im_path = pathlib.Path(os.path.dirname(__file__)) / "test_data/tiff_with_exif.tiff"

  p = image_processor.ImageProcessor()
  info, _ = await p.GetFileInfo(im_path, None)
  assert info.exif_data == store_schema.ExifData(
      orientation=1,
      software="Mac OS X 10.5.7 (9J61)",
      datetime="2009:09:26 01:11:52",
      compression=5,
      photometric_interpretation=2,
      image_width=196,
      image_height=257,
  )


@pytest.mark.asyncio
async def test_RawExifDataIsCorrectlyRead():
  im_path = pathlib.Path(os.path.dirname(__file__)) / "test_data/raw_with_exif.nef"

  p = image_processor.ImageProcessor()
  info, _ = await p.GetFileInfo(im_path, None)
  assert info.exif_data == store_schema.ExifData(
      make='NIKON CORPORATION',
      model='NIKON D90',
      orientation=1,
      x_resolution=300,
      y_resolution=300,
      resolution_unit=2,
      software='Ver.1.00 ',
      datetime='2019:06:10 09:17:13',
      exposure_program=1,
      iso_speed_ratings=400,
      datetime_original='2019:06:10 09:17:13',
      datetime_digitized='2019:06:10 09:17:13',
      exposure_bias_value=1/3,
      max_aperture_value=3,
      metering_mode=5,
      light_source=0,
      flash=0,
      focal_length=24,
      image_width=160,
      bits_per_sample=8,
      compression=1,
      photometric_interpretation=2
  )
