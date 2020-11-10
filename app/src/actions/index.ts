import { ActionService } from './action-service';
import { DefaultOrientationAction, FlipHorizontalAction, FlipVerticalAction, labelActions, rateActions, RotateCCWAction, RotateCWAction, ExportToFolderAction } from './edit';
import { SaveAction, SaveAsAction, ShowMediaFileAction } from './file';

let _actionService: ActionService | undefined;
export function actionServiceSingleton(): ActionService {
  if (!_actionService) {
    _actionService = new ActionService();

    _actionService.registerAction(new SaveAction());
    _actionService.registerAction(new SaveAsAction());
    _actionService.registerAction(new ShowMediaFileAction());

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
