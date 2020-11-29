import VueI18n from 'vue-i18n'
import Vue from 'vue'

import store from '../store/index.js'

Vue.use(VueI18n)

const messages = {
  en: {
    'title': 'Gobang',
    'settings': 'Settings',
    'changes': 'Changelog',
    'lang': 'Language',
    'search deep': 'Search Deep',
    'idiot': 'Idiot',
    'easy': 'Easy',
    'normal': 'Normal',
    'hard': 'Hard',
    'start': 'START',
    'give': 'GIVE',
    'forward': 'FWD',
    'backward': 'BWD',
    'show steps': 'Show Steps',
    'step spread': 'Step Spread',
    'random': 'Random Opening',
    'home': 'Home',
    'about': 'About',
    'status': {
      'loading': 'Loading...',
      'start': 'Click `Start` Button',
      'thinking': 'Thinking...',
      'playing': 'Score {score}, Step: {step}, Time: {time}'
    },
    'you lose': 'You Lose',
    'you win': 'You Win',
    'dialog': {
      'chooseOffensiveTitle': 'Choose Offensive',
      'chooseOffensiveBody': 'Who is to go on the offensive?',
      'me': 'Me',
      'xuanxuan': 'Computer',
      'giveTitle': 'Give up?',
      'giveBody': 'Are you sure to give up?',
      'ok': 'OK',
      'cancel': 'Cancel'
    }
  },
  zh: {
    'title': '五子棋',
    'settings': '设置',
    'changes': '更新日志',
    'lang': '语言',
    'search deep': '思考深度',
    'idiot': '萌新',
    'easy': '简单',
    'normal': '普通',
    'hard': '困难',
    'start': '开始',
    'give': '认输',
    'forward': '前进',
    'backward': '后退',
    'show steps': '显示序号',
    'step spread': '单步延伸',
    'random': '随机开局',
    'home': '首页',
    'about': '关于',
    'status': {
      'loading': '正在加载...',
      'start': '请点击 `开始` 按钮',
      'thinking': '正在思考...',
      'playing': '分数 {score}, 步数: {step}, 时间: {time}'
    },
    'you lose': '你输了',
    'you win': '你赢了',
    'dialog': {
      'chooseOffensiveTitle': '选择先手',
      'chooseOffensiveBody': '谁是先手下子？',
      'me': '我',
      'xuanxuan': '电脑',
      'giveTitle': '认输?',
      'giveBody': '你确定认输吗?',
      'ok': '确认',
      'cancel': '取消'
    }
  }
}

export default new VueI18n({
  locale: store.getters.lang,
  messages
})
