import '@mdi/font/css/materialdesignicons.css';
import * as log from 'loglevel';
import { Pane, Splitpanes } from 'splitpanes';
import 'splitpanes/dist/splitpanes.css';
import { createApp } from 'vue';
import VueFinalModal from 'vue-final-modal';
import VueObserveVisibility from 'vue-observe-visibility'; // required by the virual scroller
import VueVirtualScroller from 'vue-virtual-scroller';
import { registerAllActions, setActionServiceSingleton } from './actions';
import { ActionService } from './actions/action-service';
import App from './App.vue';
import { ApiService, setApiServiceSingleton } from './backend/api';
import { BackendMirror, setBackendMirrorSingleton } from './backend/backend-mirror';
import { DragHelperService, setDragHelperServiceSingleton } from './lib/drag-helper-service';
import { ElectronHelperService, setElectronHelperServiceSingleton } from './lib/electron-helper-service';
import { ModalHelperService, setModalHelperServiceSingleton } from './lib/modal-helper-service';
import { setStoreSingleton, setTransientStoreSingleton } from './store';
import { Store } from './store/store';
import { TransientStore } from './store/transient-store';



log.setDefaultLevel(log.levels.INFO);

const app = createApp(App);

app.use(VueVirtualScroller);
app.use(VueObserveVisibility); // required by the virual scroller
app.use(VueFinalModal);

app.component('splitpane-container', Splitpanes);
// eslint-disable-next-line vue/multi-word-component-names
app.component('splitpane', Pane);

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

const modalHelperService = new ModalHelperService(app);
setModalHelperServiceSingleton(modalHelperService);

// This has to happen at the latest step, as some actions depend on existing singletons.
registerAllActions(actionService);
//
// <- Initializing singletons.
//

app.mount('#app');

