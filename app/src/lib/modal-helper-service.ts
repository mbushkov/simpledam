import { App, defineComponent } from "vue";
import { VueFinalModalProperty } from "vue-final-modal";

export class ModalHelperService {
  private $vfm: VueFinalModalProperty | undefined;

  constructor(private readonly app: App) {
  }

  setVfm($vfm?: VueFinalModalProperty) {
    this.$vfm = $vfm;
  }

  openModal(component: ReturnType<typeof defineComponent>) {
    if (!this.$vfm) {
      return;
    }

    if (!this.app.component(component.constructor.name)) {
      this.app.component(component.constructor.name, component);
    }
    this.$vfm.show({
      component: component.constructor.name,
    });
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
