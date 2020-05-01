import Vue from 'vue';
import Vuex from 'vuex';
import VueRx from 'vue-rx';
import VueCompositionApi from '@vue/composition-api';

import App from './App.vue'

Vue.use(Vuex);
Vue.use(VueRx);
Vue.use(VueCompositionApi);

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
