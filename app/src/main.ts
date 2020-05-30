import Vue from 'vue';
import VueRx from 'vue-rx';
import VueCompositionApi from '@vue/composition-api';
import Buefy from 'buefy';
import VueVirtualScroller from 'vue-virtual-scroller';
import VueObserveVisibility from 'vue-observe-visibility'; // required by the virual scroller
import { Splitpanes, Pane } from 'splitpanes';

import '@mdi/font/css/materialdesignicons.css'
import 'splitpanes/dist/splitpanes.css'

import App from './App.vue'

Vue.use(VueRx);
Vue.use(VueCompositionApi);
Vue.use(Buefy)
Vue.use(VueVirtualScroller);
Vue.use(VueObserveVisibility); // required by the virual scroller

Vue.component('splitpane-container', Splitpanes);
Vue.component('splitpane', Pane);

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
}).$mount('#app')
