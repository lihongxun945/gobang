import { SET_DEEP, SET_LANG } from '../mutations.js'

const state = {
  lang: 'en',
  deep: 6,
  deepList: [{
    value: 6,
    title: 'easy'
  }, {
    value: 8,
    title: 'normal'
  }, {
    value: 10,
    title: 'hard'
  }]
}

const getters = {
  lang: state => state.lang,
  deep: state => state.deep,
  deepList: state => state.deepList
}

const mutations = {
  [SET_DEEP] (state, deep) {
    state.deep = deep
  },
  [SET_LANG] (state, lang) {
    state.lang = lang
  }
}

const actions = {
  [SET_DEEP] ({commit}, deep) {
    commit(SET_DEEP, deep)
  },
  [SET_LANG] ({commit}, lang) {
    commit(SET_LANG, lang)
  }
}

export default {
  namespace: true,
  state,
  getters,
  actions,
  mutations
}
