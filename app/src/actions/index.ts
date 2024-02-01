import { ActionService } from './action-service';
import { SaveAction, SaveAndCloseAction, SaveAsAction, ScanPathsAction } from './file';
import { DefaultOrientationAction, DeselectAllAction, ExportToFolderAction, FlipHorizontalAction, FlipVerticalAction, labelActions, rateActions, RotateCCWAction, RotateCWAction, SelectAllAction, ShowMediaFileAction } from './selection';
import { SortByFileCreationTimeAscAction, SortByFileCreationTimeDescAction, SortByFileNameAscAction, SortByFileNameDescAction, SortByOriginTimeAscAction, SortByOriginTimeDescAction } from './sort';

let _actionServiceSingleton: ActionService | undefined;

export function actionServiceSingleton(): ActionService {
  if (!_actionServiceSingleton) {
    throw new Error('actionServiceSingleton not set')
  }

  return _actionServiceSingleton;
}

export function setActionServiceSingleton(value: ActionService) {
  _actionServiceSingleton = value;
}


export function registerAllActions(actionService: ActionService) {
  actionService.registerAction(new SaveAction());
  actionService.registerAction(new SaveAndCloseAction());
  actionService.registerAction(new SaveAsAction());
  actionService.registerAction(new ShowMediaFileAction());
  actionService.registerAction(new ScanPathsAction());

  actionService.registerAction(new SelectAllAction());
  actionService.registerAction(new DeselectAllAction());
  actionService.registerAction(new RotateCWAction());
  actionService.registerAction(new RotateCCWAction());
  actionService.registerAction(new FlipHorizontalAction());
  actionService.registerAction(new FlipVerticalAction());
  actionService.registerAction(new DefaultOrientationAction());
  actionService.registerAction(new ExportToFolderAction());

  for (const action of labelActions()) {
    actionService.registerAction(action);
  }

  for (const action of rateActions()) {
    actionService.registerAction(action);
  }  

  actionService.registerAction(new SortByFileNameAscAction());
  actionService.registerAction(new SortByFileNameDescAction());
  actionService.registerAction(new SortByOriginTimeAscAction());
  actionService.registerAction(new SortByOriginTimeDescAction());
  actionService.registerAction(new SortByFileCreationTimeAscAction());
  actionService.registerAction(new SortByFileCreationTimeDescAction());
}