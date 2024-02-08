import { App, defineComponent } from "vue";
import { Vfm, useModal } from "vue-final-modal";

export class ModalHelperService {
  private $vfm: Vfm | undefined;

  constructor(private readonly app: App) {
  }

  setVfm($vfm?: Vfm) {
    this.$vfm = $vfm;
  }

  openModal(component: ReturnType<typeof defineComponent>) {
    if (!this.$vfm) {
      return;
    }

    const { open } = useModal({
      component,
    });
    open();
  }
}

let _ModalHelperServiceSingleton: ModalHelperService | undefined;
export function modalHelperServiceSingleton(): ModalHelperService {
  if (!_ModalHelperServiceSingleton) {
    throw new Error('ModalHelperServiceSingleton not set');
  }
  return _ModalHelperServiceSingleton;
}

export function setModalHelperServiceSingleton(value: ModalHelperService) {
  _ModalHelperServiceSingleton = value;
}
