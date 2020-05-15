import Vue from 'vue';
import Vuex from 'vuex';
import VueRx from 'vue-rx';
import VueCompositionApi from '@vue/composition-api';
import Buefy from 'buefy'

import '@mdi/font/css/materialdesignicons.css'

import App from './App.vue'

const webFrame = window.require('electron').webFrame;
webFrame.setZoomFactor(1);
webFrame.setVisualZoomLevelLimits(1, 1);

Vue.use(Buefy)
Vue.use(Vuex);
Vue.use(VueRx);
Vue.use(VueCompositionApi);

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
}).$mount('#app')
