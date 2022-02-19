import Vue from 'vue';
import VueRx from 'vue-rx';
import VueCompositionApi from '@vue/composition-api';
import Buefy from 'buefy';
import VueVirtualScroller from 'vue-virtual-scroller';
import VueObserveVisibility from 'vue-observe-visibility'; // required by the virual scroller
import { Splitpanes, Pane } from 'splitpanes';
import * as log from 'loglevel';

import '@mdi/font/css/materialdesignicons.css'
import 'splitpanes/dist/splitpanes.css'

import App from './App.vue'
import { ElectronHelperService, setElectronHelperServiceSingleton } from './lib/electron-helper-service';
import { ApiService, setApiServiceSingleton } from './backend/api';
import { ActionService } from './actions/action-service';
import { registerAllActions, setActionServiceSingleton } from './actions';
import { TransientStore } from './store/transient-store';
import { setStoreSingleton, setTransientStoreSingleton } from './store';
import { Store } from './store/store';
import { BackendMirror, setBackendMirrorSingleton } from './backend/backend-mirror';
import { DragHelperService, setDragHelperServiceSingleton } from './lib/drag-helper-service';
import { ModalHelperService, setModalHelperServiceSingleton } from './lib/modal-helper-service';

log.setDefaultLevel(log.levels.INFO);

Vue.use(VueRx);
Vue.use(VueCompositionApi);
Vue.use(Buefy)
Vue.use(VueVirtualScroller);
Vue.use(VueObserveVisibility); // required by the virual scroller

Vue.component('splitpane-container', Splitpanes);
Vue.component('splitpane', Pane);

Vue.config.productionTip = false;

//
// -> Initializing singletons.
//
const electronHelperService = new ElectronHelperService();
setElectronHelperServiceSingleton(electronHelperService);

const apiService = new ApiService();
setApiServiceSingleton(apiService);

const actionService = new ActionService(electronHelperService);
setActionServiceSingleton(actionService);

const transientStore = new TransientStore(apiService.ws);
setTransientStoreSingleton(transientStore);

const store = new Store(transientStore, apiService);
setStoreSingleton(store);

const backendMirror = new BackendMirror(apiService);
setBackendMirrorSingleton(backendMirror);

const dragHelperService = new DragHelperService(electronHelperService);
setDragHelperServiceSingleton(dragHelperService);

const modalHelperService = new ModalHelperService();
setModalHelperServiceSingleton(modalHelperService);

// This has to happen at the latest step, as some actions depend on existing singletons.
registerAllActions(actionService);
//
// <- Initializing singletons.
//

new Vue({
  render: h => h(App),
}).$mount('#app')
