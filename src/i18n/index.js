import VueI18n from 'vue-i18n'
import Vue from 'vue'

import store from '../store/index.js'

Vue.use(VueI18n)

const messages = {
  en: {
    'title': 'Xuanxuan Gobang',
    'settings': 'Settings',
    'lang': 'Language',
    'search deep': 'Search Deep',
    'easy': 'Easy',
    'normal': 'Normal',
    'hard': 'Hard',
    'start': 'START',
    'give': 'GIVE',
    'forward': 'FWD',
    'backward': 'BWD',
  },
  zh: {
    'title': '轩轩五子棋',
    'settings': '设置',
    'lang': '语言',
    'search deep': '思考深度',
    'easy': '简单',
    'normal': '普通',
    'hard': '困难',
    'start': '开始',
    'give': '认输',
    'forward': '前进',
    'backward': '后退',
  }
}

export default new VueI18n({
  locale: store.getters.lang,
  messages
})
