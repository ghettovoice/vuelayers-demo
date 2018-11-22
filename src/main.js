import '@babel/polyfill'
import Vue from 'vue'
import Buefy from 'buefy'
import 'buefy/dist/buefy.css'
// import VueLayers modules
import VueLayers from 'vuelayers'
// import VueLayers styles
import 'vuelayers/lib/style.css'
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

/* eslint-disable no-new */
new Vue({
  el: '#app',
  render: h => h(App),
})
