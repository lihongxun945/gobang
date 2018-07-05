import { SET_DEEP, SET_LANG,SET_SHOW_STEPS, SET_STATUS } from '../mutations.js'
import * as status from '@/status'

const state = {
  lang: 'en',
  deep: 6,
  showSteps: true,
  status: status.LOADING,
  deepList: [{
    value: 4,
    title: 'idiot'
  }, {
    value: 6,
    title: 'easy'
  }, {
    value: 8,
    title: 'normal'
  }]
}

const getters = {
  lang: state => state.lang,
  deep: state => state.deep,
  deepList: state => state.deepList,
  status: state => state.status,
  showSteps: state => state.showSteps
}

const mutations = {
  [SET_DEEP] (state, deep) {
    state.deep = deep
  },
  [SET_LANG] (state, lang) {
    state.lang = lang
  },
  [SET_SHOW_STEPS] (state, show) {
    state.showSteps = show
  },
  [SET_STATUS] (state, status) {
    state.status = status
  }
}

const actions = {
  [SET_DEEP] ({commit}, deep) {
    commit(SET_DEEP, deep)
  },
  [SET_LANG] ({commit}, lang) {
    commit(SET_LANG, lang)
  },
  [SET_SHOW_STEPS] ({commit}, show) {
    commit(SET_SHOW_STEPS, show)
  },
  [SET_STATUS] ({commit}, status) {
    commit(SET_STATUS, status)
  }

}

export default {
  namespace: true,
  state,
  getters,
  actions,
  mutations
}
