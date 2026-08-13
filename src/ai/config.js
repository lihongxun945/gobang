// 一些全局配置放在这里，其中有一些配置是用来控制一些不稳定的功能是否开启的，比如缓存，只搜索一条线上的点位等。
export const config = {
  enableCache: true, // 是否开启缓存
  pointsLimit: 20, // 靠近根节点时最多搜索节点数
  rootPointsLimit: 32, // 根节点保留更多候选，降低关键点被裁掉的概率
  deepPointsLimit: 12, // 深层减少普通候选，将节点预算留给主变化
  onlyInLine: false, // 是否只搜索一条线上的点位，一种优化方式。
  inlineCount: 4, // 最近多少个点位能算作
  inLineDistance: 5, // 判断点位是否在一条线上的最大距离
}
