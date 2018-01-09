import Vue from 'vue'
import Buefy from 'buefy'
import 'buefy/lib/buefy.css'
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
  // returns old behavior like in < v0.9
  // bindToProj: 'EPSG:4326',
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  render: h => h(App),
})
