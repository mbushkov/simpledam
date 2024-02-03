import os
import pathlib
import pytest

from newmedia import image_processor, store_schema


@pytest.mark.asyncio
async def test_JPEGExifDataIsCorrectlyRead():
  im_path = pathlib.Path(os.path.dirname(__file__)) / "test_data/jpeg_with_exif.jpeg"

  p = image_processor.ImageProcessor()
  info = await p.GetFileInfo(im_path, None)
  assert info.icc_profile_description == "sRGB IEC61966-2.1"
  assert info.mime_type == "image/jpeg"
  assert info.size == store_schema.Size(100, 68)
  assert info.exif_data == store_schema.ImageFileMetadata(
      {
          'ApertureValue': store_schema.MetadataValue(value='368640/65536', type_id=5),
          'ColorSpace': store_schema.MetadataValue(value='1', type_id=3),
          'Compression': store_schema.MetadataValue(value='6', type_id=3),
          'CustomRendered': store_schema.MetadataValue(value='0', type_id=3),
          'ExifTag': store_schema.MetadataValue(value='214', type_id=4),
          'ExposureBiasValue': store_schema.MetadataValue(value='0/1', type_id=10),
          'ExposureMode': store_schema.MetadataValue(value='1', type_id=3),
          'ExposureProgram': store_schema.MetadataValue(value='1', type_id=3),
          'ExposureTime': store_schema.MetadataValue(value='1/160', type_id=5),
          'Flash': store_schema.MetadataValue(value='9', type_id=3),
          'FNumber': store_schema.MetadataValue(value='71/10', type_id=5),
          'FocalLength': store_schema.MetadataValue(value='135/1', type_id=5),
          'FocalPlaneResolutionUnit': store_schema.MetadataValue(value='2', type_id=3),
          'FocalPlaneXResolution': store_schema.MetadataValue(value='3888000/876', type_id=5),
          'FocalPlaneYResolution': store_schema.MetadataValue(value='2592000/583', type_id=5),
          'GPSTag': store_schema.MetadataValue(value='978', type_id=4),
          'InteroperabilityIndex': store_schema.MetadataValue(value='R98', type_id=2),
          'InteroperabilityTag': store_schema.MetadataValue(value='948', type_id=4),
          'ISOSpeedRatings': store_schema.MetadataValue(value='100', type_id=3),
          'JPEGInterchangeFormat': store_schema.MetadataValue(value='1090', type_id=4),
          'JPEGInterchangeFormatLength': store_schema.MetadataValue(value='1378', type_id=4),
          'MeteringMode': store_schema.MetadataValue(value='5', type_id=3),
          'Orientation': store_schema.MetadataValue(value='1', type_id=3),
          'PixelXDimension': store_schema.MetadataValue(value='100', type_id=4),
          'PixelYDimension': store_schema.MetadataValue(value='68', type_id=4),
          'ResolutionUnit': store_schema.MetadataValue(value='2', type_id=3),
          'SceneCaptureType': store_schema.MetadataValue(value='0', type_id=3),
          'ShutterSpeedValue': store_schema.MetadataValue(value='483328/65536', type_id=10),
          'SubSecTime': store_schema.MetadataValue(value='00', type_id=2),
          'SubSecTimeDigitized': store_schema.MetadataValue(value='00', type_id=2),
          'SubSecTimeOriginal': store_schema.MetadataValue(value='00', type_id=2),
          'WhiteBalance': store_schema.MetadataValue(value='0', type_id=3),
          'XResolution': store_schema.MetadataValue(value='72/1', type_id=5),
          'YCbCrPositioning': store_schema.MetadataValue(value='2', type_id=3),
          'YResolution': store_schema.MetadataValue(value='72/1', type_id=5),
      }
  )


@pytest.mark.asyncio
async def test_TIFFExifDataIsCorrectlyRead():
  im_path = pathlib.Path(os.path.dirname(__file__)) / "test_data/tiff_with_exif.tiff"

  p = image_processor.ImageProcessor()
  info = await p.GetFileInfo(im_path, None)
  assert info.icc_profile_description == "Color LCD"
  assert info.mime_type == "image/tiff"
  assert info.size == store_schema.Size(196, 257)
  assert info.exif_data == store_schema.ImageFileMetadata(
      {
          'BitsPerSample': store_schema.MetadataValue(value='8 8 8 8', type_id=3),
          'Compression': store_schema.MetadataValue(value='5', type_id=3),
          'ExtraSamples': store_schema.MetadataValue(value='1', type_id=3),
          'ImageLength': store_schema.MetadataValue(value='257', type_id=3),
          'ImageWidth': store_schema.MetadataValue(value='196', type_id=3),
          'Orientation': store_schema.MetadataValue(value='1', type_id=3),
          'PhotometricInterpretation': store_schema.MetadataValue(value='2', type_id=3),
          'PlanarConfiguration': store_schema.MetadataValue(value='1', type_id=3),
          'Predictor': store_schema.MetadataValue(value='2', type_id=3),
          'RowsPerStrip': store_schema.MetadataValue(value='167', type_id=3),
          'SampleFormat': store_schema.MetadataValue(value='1 1 1 1', type_id=3),
          'SamplesPerPixel': store_schema.MetadataValue(value='4', type_id=3),
          'StripByteCounts': store_schema.MetadataValue(value='59502 27296', type_id=4),
          'StripOffsets': store_schema.MetadataValue(value='8 59510', type_id=4),
      }
  )


@pytest.mark.asyncio
async def test_RawExifDataIsCorrectlyRead():
  im_path = pathlib.Path(os.path.dirname(__file__)) / "test_data/raw_with_exif.nef"

  p = image_processor.ImageProcessor()
  info = await p.GetFileInfo(im_path, None)
  assert not info.icc_profile_description
  assert info.mime_type == "image/x-nikon-nef"
  assert info.size == store_schema.Size(4352, 2868)
  assert info.exif_data == store_schema.ImageFileMetadata(
      {
          '0x008e': store_schema.MetadataValue(value='49484 8192 4288', type_id=3),
          'ActiveDLighting': store_schema.MetadataValue(value='65535', type_id=3),
          'AFAreaHeight': store_schema.MetadataValue(value='0', type_id=3),
          'AFAreaWidth': store_schema.MetadataValue(value='0', type_id=3),
          'AFAreaXPosition': store_schema.MetadataValue(value='0', type_id=3),
          'AFAreaYPosition': store_schema.MetadataValue(value='0', type_id=3),
          'AFImageHeight': store_schema.MetadataValue(value='0', type_id=3),
          'AFImageWidth': store_schema.MetadataValue(value='0', type_id=3),
          'AutoBracketRelease': store_schema.MetadataValue(value='255', type_id=3),
          'BitsPerSample': store_schema.MetadataValue(value='12', type_id=3),
          'ByteOrder': store_schema.MetadataValue(value='MM', type_id=2),
          'CFARepeatPatternDim': store_schema.MetadataValue(value='2 2', type_id=3),
          'ColorSpace': store_schema.MetadataValue(value='1', type_id=3),
          'Compression': store_schema.MetadataValue(value='6', type_id=3),
          'Contrast': store_schema.MetadataValue(value='0', type_id=3),
          'ContrastDetectAFInFocus': store_schema.MetadataValue(value='0', type_id=3),
          'CustomRendered': store_schema.MetadataValue(value='0', type_id=3),
          'DeletedImageCount': store_schema.MetadataValue(value='215613446', type_id=4),
          'DigitalZoomRatio': store_schema.MetadataValue(value='1/1', type_id=5),
          'DirectoryNumber': store_schema.MetadataValue(value='100', type_id=3),
          'ExifTag': store_schema.MetadataValue(value='480', type_id=4),
          'ExposureBiasValue': store_schema.MetadataValue(value='2/6', type_id=10),
          'ExposureBracketComp': store_schema.MetadataValue(value='0/6', type_id=10),
          'ExposureMode': store_schema.MetadataValue(value='1', type_id=3),
          'ExposureProgram': store_schema.MetadataValue(value='1', type_id=3),
          'ExposureTime': store_schema.MetadataValue(value='10/2000', type_id=5),
          'ExternalFlashFirmware': store_schema.MetadataValue(value='0', type_id=3),
          'FileNumber': store_schema.MetadataValue(value='489', type_id=3),
          'Flash': store_schema.MetadataValue(value='0', type_id=3),
          'FNumber': store_schema.MetadataValue(value='40/10', type_id=5),
          'FocalLength': store_schema.MetadataValue(value='240/10', type_id=5),
          'FocalLengthIn35mmFilm': store_schema.MetadataValue(value='36', type_id=3),
          'GainControl': store_schema.MetadataValue(value='1', type_id=3),
          'GPSTag': store_schema.MetadataValue(value='122404', type_id=4),
          'HighISONoiseReduction': store_schema.MetadataValue(value='0', type_id=3),
          'ImageLength': store_schema.MetadataValue(value='2868', type_id=4),
          'ImageWidth': store_schema.MetadataValue(value='4352', type_id=4),
          'ISOExpansion': store_schema.MetadataValue(value='0', type_id=3),
          'ISOExpansion2': store_schema.MetadataValue(value='0', type_id=3),
          'ISOSettings': store_schema.MetadataValue(value='0 400', type_id=3),
          'ISOSpeed': store_schema.MetadataValue(value='0 400', type_id=3),
          'ISOSpeedRatings': store_schema.MetadataValue(value='400', type_id=3),
          'JPEGInterchangeFormat': store_schema.MetadataValue(value='14062', type_id=4),
          'JPEGInterchangeFormatLength': store_schema.MetadataValue(value='107319', type_id=4),
          'Lens': store_schema.MetadataValue(value='240/10 240/10 28/10 28/10', type_id=5),
          'LightSource': store_schema.MetadataValue(value='0', type_id=3),
          'MaxApertureValue': store_schema.MetadataValue(value='30/10', type_id=5),
          'MeteringMode': store_schema.MetadataValue(value='5', type_id=3),
          'MultiExposureAutoGain': store_schema.MetadataValue(value='0', type_id=4),
          'MultiExposureMode': store_schema.MetadataValue(value='0', type_id=4),
          'MultiExposureShots': store_schema.MetadataValue(value='0', type_id=4),
          'NEFCompression': store_schema.MetadataValue(value='4', type_id=3),
          'NewSubfileType': store_schema.MetadataValue(value='0', type_id=4),
          'Offset': store_schema.MetadataValue(value='1012', type_id=4),
          'Orientation': store_schema.MetadataValue(value='1', type_id=3),
          'PhotometricInterpretation': store_schema.MetadataValue(value='32803', type_id=3),
          'PlanarConfiguration': store_schema.MetadataValue(value='1', type_id=3),
          'Preview': store_schema.MetadataValue(value='13954', type_id=4),
          'RawImageCenter': store_schema.MetadataValue(value='2176 1434', type_id=3),
          'ResolutionUnit': store_schema.MetadataValue(value='2', type_id=3),
          'RowsPerStrip': store_schema.MetadataValue(value='2868', type_id=4),
          'SamplesPerPixel': store_schema.MetadataValue(value='1', type_id=3),
          'Saturation': store_schema.MetadataValue(value='0', type_id=3),
          'SceneCaptureType': store_schema.MetadataValue(value='0', type_id=3),
          'SensingMethod': store_schema.MetadataValue(value='2', type_id=3),
          'Sharpness': store_schema.MetadataValue(value='0', type_id=3),
          'ShootingMode': store_schema.MetadataValue(value='0', type_id=3),
          'ShutterCount': store_schema.MetadataValue(value='119765', type_id=4),
          'ShutterCount1': store_schema.MetadataValue(value='270', type_id=4),
          'StripByteCounts': store_schema.MetadataValue(value='9741474', type_id=4),
          'StripOffsets': store_schema.MetadataValue(value='1801024', type_id=4),
          'SubIFDs': store_schema.MetadataValue(value='180024 180144', type_id=4),
          'SubjectDistanceRange': store_schema.MetadataValue(value='0', type_id=3),
          'SubSecTime': store_schema.MetadataValue(value='00', type_id=2),
          'SubSecTimeDigitized': store_schema.MetadataValue(value='00', type_id=2),
          'SubSecTimeOriginal': store_schema.MetadataValue(value='00', type_id=2),
          'Timezone': store_schema.MetadataValue(value='60', type_id=8),
          'WB_RBLevels': store_schema.MetadataValue(value='446/256 387/256 256/256 256/256', type_id=5),
          'WB_RGGBLevels': store_schema.MetadataValue(value='2848 0 0 0', type_id=3),
          'WhiteBalance': store_schema.MetadataValue(value='0', type_id=3),
          'WhiteBalanceBias': store_schema.MetadataValue(value='0 0', type_id=8),
          'XResolution': store_schema.MetadataValue(value='300/1', type_id=5),
          'YCbCrPositioning': store_schema.MetadataValue(value='2', type_id=3),
          'YResolution': store_schema.MetadataValue(value='300/1', type_id=5),
      }
  )
  # assert info.exif_data == store_schema.ExifData(
  #     make='NIKON CORPORATION',
  #     model='NIKON D90',
  #     orientation=1,
  #     x_resolution=300,
  #     y_resolution=300,
  #     resolution_unit=2,
  #     software='Ver.1.00 ',
  #     datetime='2019:06:10 09:17:13',
  #     exposure_program=1,
  #     iso_speed_ratings=400,
  #     datetime_original='2019:06:10 09:17:13',
  #     datetime_digitized='2019:06:10 09:17:13',
  #     exposure_bias_value=1/3,
  #     max_aperture_value=3,
  #     metering_mode=5,
  #     light_source=0,
  #     flash=0,
  #     focal_length=24,
  #     image_width=160,
  #     bits_per_sample=8,
  #     compression=1,
  #     photometric_interpretation=2
  # )
