import Vue from 'vue'
import Buefy from 'buefy'
import VueLayers from 'vuelayers'
import App from './App.vue'

Vue.config.productionTip = false

Vue.use(Buefy, {
  defaultIconPack: 'fa',
})
// register all VueLayers components
Vue.use(VueLayers, {
  // global data projection, see https://vuelayers.github.io/#/quickstart?id=global-data-projection
  // dataProjection: 'EPSG:4326',
})


new Vue({
  render: h => h(App),
}).$mount('#app')
