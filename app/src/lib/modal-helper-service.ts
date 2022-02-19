export class ModalHelperService {
}

let _ModalHelperServiceSingleton: ModalHelperService | undefined;
export function ModalHelperServiceSingleton(): ModalHelperService {
  if (!_ModalHelperServiceSingleton) {
    throw new Error('ModalHelperServiceSingleton not set');
  }
  return _ModalHelperServiceSingleton;
}

export function setModalHelperServiceSingleton(value: ModalHelperService) {
  _ModalHelperServiceSingleton = value;
}
