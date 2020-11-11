import { ActionService } from './action-service';
import { SaveAction, SaveAndCloseAction, SaveAsAction } from './file';
import { DefaultOrientationAction, DeselectAllAction, ExportToFolderAction, FlipHorizontalAction, FlipVerticalAction, labelActions, rateActions, RotateCCWAction, RotateCWAction, SelectAllAction, ShowMediaFileAction } from './selection';

let _actionService: ActionService | undefined;
export function actionServiceSingleton(): ActionService {
  if (!_actionService) {
    _actionService = new ActionService();

    _actionService.registerAction(new SaveAction());
    _actionService.registerAction(new SaveAndCloseAction());
    _actionService.registerAction(new SaveAsAction());
    _actionService.registerAction(new ShowMediaFileAction());

    _actionService.registerAction(new SelectAllAction());
    _actionService.registerAction(new DeselectAllAction());
    _actionService.registerAction(new RotateCWAction());
    _actionService.registerAction(new RotateCCWAction());
    _actionService.registerAction(new FlipHorizontalAction());
    _actionService.registerAction(new FlipVerticalAction());
    _actionService.registerAction(new DefaultOrientationAction());
    _actionService.registerAction(new ExportToFolderAction());

    for (const action of labelActions()) {
      _actionService.registerAction(action);
    }

    for (const action of rateActions()) {
      _actionService.registerAction(action);
    }
  }
  return _actionService;
}
