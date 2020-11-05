import { ActionService } from './action-service';
import { labelActions } from './edit';
import { SaveAction, SaveAsAction } from './file';

let _actionService: ActionService | undefined;
export function actionServiceSingleton(): ActionService {
  if (!_actionService) {
    _actionService = new ActionService();

    _actionService.registerAction(new SaveAction());
    _actionService.registerAction(new SaveAsAction());

    for (const action of labelActions()) {
      _actionService.registerAction(action);
    }
  }
  return _actionService;
}
