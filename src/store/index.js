import Vue from 'vue'
import Vuex from 'vuex'

import home from './modules/home.js'
import board from './modules/board.js'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    home,
    board
  },
  state: {
    version: "V3.0.0-beta.3"
  },
  mutations: {
  },
  actions: {
  }
})
