import { ActionService } from './action-service';
import { SaveAction, SaveAsAction } from './file';

let _actionService: ActionService | undefined;
export function actionServiceSingleton(): ActionService {
  if (!_actionService) {
    _actionService = new ActionService();
    _actionService.registerAction(new SaveAction());
    _actionService.registerAction(new SaveAsAction());
  }
  return _actionService;
}
