import moment from "moment";
import { InferredAttributeType, type ImageFile, type ImageMetadata, type InferredAttributeGroup } from "./schema";

type InferredFileAttributes = {
  name: string;
  path: string;
  size: number;
  cTime: moment.Moment;
  mTime: moment.Moment;
  mimeType: string;
};

type InferredImageAttributes = {
  width: number;
  height: number;
  iccProfileDescription: string;
};

type InferredExifAttributes = {
  make: string;
  model: string;
};

type InferredGeoAttributes = {
  latitude: number;
  longitude: number;
};

type InterredAttributes = {
  file: InferredFileAttributes;
  image: InferredImageAttributes;
  exif: InferredExifAttributes;
  geo: InferredGeoAttributes;
};


export function inferAttributes(imageFile: ImageFile, imageMetadata: ImageMetadata): InferredAttributeGroup[] {
  return [
    {
      name: 'file',
      title: 'File',
      attributes: [
        {
          type: InferredAttributeType.STRING,
          name: 'fileName',
          title: 'File Name',
          value: imageFile.path.split('/').pop() || '',
        },
        {
          type: InferredAttributeType.STRING,
          name: 'filePath',
          title: 'File Path',
          value: imageFile.path,
        },
        {
          type: InferredAttributeType.INTEGER,
          name: 'fileSize',
          title: 'File Size',
          value: imageFile.file_size,
        },
        {
          type: InferredAttributeType.DATE_TIME,
          name: 'fileCTime',
          title: 'File Creation Time',
          value: moment(imageFile.file_ctime).format(),
        },
        {
          type: InferredAttributeType.DATE_TIME,
          name: 'fileMTime',
          title: 'File Modification Time',
          value: moment(imageFile.file_mtime).format(),
        },
        {
          type: InferredAttributeType.DATE_TIME,
          name: 'mimeType',
          title: 'Mime Type',
          value: moment(imageFile.mime_type).format(),
        },        
      ]
    },
    {
      name: 'image',
      title: 'Image',
      attributes: [
        {
          type: InferredAttributeType.INTEGER,
          name: 'width',
          title: 'Width',
          value: imageFile.size.width,
        },
        {
          type: InferredAttributeType.INTEGER,
          name: 'height',
          title: 'Height',
          value: imageFile.size.height,
        },
        {
          type: InferredAttributeType.STRING,
          name: 'iccProfileDescription',
          title: 'ICC Profile Description',
          value: imageFile.icc_profile_description,
        },
      ]
    },
    {
      name: 'exif',
      title: 'Exif',
      attributes: [
        {
          type: InferredAttributeType.STRING,
          name: 'make',
          title: 'Make',
          value: imageFile.exif_data.make
        },
        {
          type: InferredAttributeType.STRING,
          name: 'model',
          title: 'Model',
          value: imageFile.exif_data.model
        },
        {
          type: InferredAttributeType.STRING,
          name: 'model',
          title: 'Model',
          value: imageFile.exif_data.model
        },

      ],
    },
    {
      name: 'geo',
      title: 'Geo',
      attributes: [
        {
          type: InferredAttributeType.FLOAT,
          name: 'latitude',
          title: 'Latitude',
          value: 0,
        },
        {
          type: InferredAttributeType.FLOAT,
          name: 'longitude',
          title: 'Longitude',
          value: 0,
        },
      ]
    }
  ];
}