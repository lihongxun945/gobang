let getBoard = function () {
  return [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ]
}

const open26 = {}

// 疏
open26.shuyue = getBoard()
open26.shuyue[5][5] = 1
open26.shuyue.name = '疏月'

// 溪
open26.xiyue = getBoard()
open26.xiyue[5][6] = 1
open26.xiyue.name = '溪月'

// 寒
open26.hanyue = getBoard()
open26.hanyue[5][7] = 1
open26.hanyue.name = '寒月'

// 残
open26.canyue = getBoard()
open26.canyue[6][5] = 1
open26.canyue.name = '残月'

// 花
open26.huayue = getBoard()
open26.huayue[6][6] = 1
open26.huayue.name = '花月'

// 金
open26.jinyue = getBoard()
open26.jinyue[7][5] = 1
open26.jinyue.name = '金月'

// 雨
open26.yuyue = getBoard()
open26.yuyue[7][6] = 1
open26.yuyue.name = '雨月'

// 新
open26.xinyue = getBoard()
open26.xinyue[8][5] = 1
open26.xinyue.name = '新月'

// 丘
open26.qiuyue = getBoard()
open26.qiuyue[8][6] = 1
open26.qiuyue.name = '丘月'

// 松
open26.songyue = getBoard()
open26.songyue[8][7] = 1
open26.songyue.name = '松月'

// 游
open26.youyue = getBoard()
open26.youyue[9][5] = 1
open26.youyue.name = '游月'

// 山
open26.shanyue = getBoard()
open26.shanyue[9][6] = 1
open26.shanyue.name = '山月'

// 瑞
open26.ruiyue = getBoard()
open26.ruiyue[9][7] = 1
open26.ruiyue.name = '瑞月'

getBoard = function () {
  return [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ]
}

// 流
open26.liuyue = getBoard()
open26.liuyue[5][5] = 1
open26.liuyue.name = '流月'

// 水
open26.shuiyue = getBoard()
open26.shuiyue[5][6] = 1
open26.shuiyue.name = '水月'

// 恒
open26.hengyue = getBoard()
open26.hengyue[5][7] = 1
open26.hengyue.name = '恒月'

// 峡
open26.xiayue = getBoard()
open26.xiayue[5][8] = 1
open26.xiayue.name = '峡月'

// 长
open26.changyue = getBoard()
open26.changyue[5][9] = 1
open26.changyue.name = '长月'

// 岚
open26.lanyue = getBoard()
open26.lanyue[6][5] = 1
open26.lanyue.name = '岚月'

// 浦
open26.puyue = getBoard()
open26.puyue[6][6] = 1
open26.puyue.name = '浦月'

// 云
open26.yunyue = getBoard()
open26.yunyue[6][7] = 1
open26.yunyue.name = '云月'

// 明
open26.mingyue = getBoard()
open26.mingyue[7][5] = 1
open26.mingyue.name = '明月'

// 银
open26.yinyue = getBoard()
open26.yinyue[7][6] = 1
open26.yinyue.name = '银月'

// 名
open26.ming2yue = getBoard()
open26.ming2yue[8][5] = 1
open26.ming2yue.name = '名月'

// 斜
open26.xieyue = getBoard()
open26.xieyue[8][6] = 1
open26.xieyue.name = '斜月'

// 慧
open26.huiyue = getBoard()
open26.huiyue[9][5] = 1
open26.huiyue.name = '慧月'

export default open26
