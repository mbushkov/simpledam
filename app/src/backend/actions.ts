import { ImageFile } from "@/store/schema";

export declare interface Action {
  action: 'FILE_REGISTERED' | 'THUMBNAIL_UPDATED' | 'LONG_OPERATION_START' | 'LONG_OPERATION_LOG' | 'LONG_OPERATION_STATUS' | 'LONG_OPERATION_SUCCESS' | 'LONG_OPERATION_ERROR' | 'BACKEND_STATE_UPDATE';
}

export declare interface FileRegisteredAction extends Action {
  action: 'FILE_REGISTERED',
  image: ImageFile;
}

export declare interface ThumbnailUpdatedAction extends Action {
  action: 'THUMBNAIL_UPDATED',
  image: ImageFile;
}

export declare interface LongOperationStartAction extends Action {
  action: 'LONG_OPERATION_START',
  loid: string,
}

export declare interface LongOperationLogAction extends Action {
  action: 'LONG_OPERATION_LOG',
  loid: string,
  log: {
    kind: 'log' | 'warning' | 'error',
    message: string,
  }
}

export declare interface LongOperationStatusAction extends Action {
  action: 'LONG_OPERATION_STATUS',
  loid: string,
  status: {
    status: string,
    progress: number,
  }
}

export declare interface LongOperationSuccessAction extends Action {
  action: 'LONG_OPERATION_SUCCESS',
  loid: string,
}

export declare interface LongOperationErrorAction extends Action {
  loid: string,
  message: string,
}

export declare interface BackendStateUpdateAction extends Action {
  action: 'BACKEND_STATE_UPDATE',
  state: any;
}
