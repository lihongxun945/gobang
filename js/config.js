module.exports = {
  opening: true, // 使用开局库
  searchDeep: 8,  //搜索深度
  countLimit: 20, //gen函数返回的节点数量上限，超过之后将会按照分数进行截断
  timeLimit: 100, // 时间限制，秒
  vcxDeep:  5,  //算杀深度
  random: false,// 在分数差不多的时候是不是随机选择一个走
  log: true,
  // TODO: 目前开启缓存后，搜索会出现一些未知的bug
  cache: false // 使用缓存, 其实只有搜索的缓存有用，其他缓存几乎无用。因为只有搜索的缓存命中后就能剪掉一整个分支，这个分支一般会包含很多个点。而在其他地方加缓存，每次命中只能剪掉一个点，影响不大。
}
