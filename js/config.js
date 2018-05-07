module.exports = {
  opening: true, // 使用开局库
  searchDeep: 6,  //搜索深度
  countLimit: 16, //gen函数返回的节点数量上限，超过之后将会按照分数进行截断
  timeLimit: 10, // 时间限制，秒
  vcxDeep:  5,  //算杀深度
  random: false,// 在分数差不多的时候是不是随机选择一个走
  log: true,
  cache: true // 使用缓存
}
