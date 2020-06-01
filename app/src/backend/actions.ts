import { ImageFile } from "@/store/schema";

export declare interface Action {
  action: 'FILE_REGISTERED' | 'THUMBNAIL_UPDATED';
}

export declare interface FileRegisteredAction extends Action {
  action: 'FILE_REGISTERED',
  image: ImageFile;
}

export declare interface ThumbnailUpdatedAction extends Action {
  action: 'THUMBNAIL_UPDATED',
  image: ImageFile;
}