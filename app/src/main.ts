import Vue from 'vue';
import VueRx from 'vue-rx';
import VueCompositionApi from '@vue/composition-api';
import Buefy from 'buefy';
import VueVirtualScroller from 'vue-virtual-scroller';
import VueObserveVisibility from 'vue-observe-visibility';

import '@mdi/font/css/materialdesignicons.css'

import App from './App.vue'

const webFrame = window.require('electron').webFrame;
webFrame.setZoomFactor(1);
webFrame.setVisualZoomLevelLimits(1, 1);

Vue.use(VueRx);
Vue.use(VueCompositionApi);
Vue.use(Buefy)
Vue.use(VueVirtualScroller);
Vue.use(VueObserveVisibility);

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
}).$mount('#app')
