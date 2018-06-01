module.exports = {
  opening: true, // 使用开局库
  searchDeep: 8,  //搜索深度
  countLimit: 20, //gen函数返回的节点数量上限，超过之后将会按照分数进行截断
  timeLimit: 100, // 时间限制，秒
  vcxDeep:  5,  //算杀深度
  random: false,// 在分数差不多的时候是不是随机选择一个走
  log: true,
  // 下面几个设置都是用来提升搜索速度的
  spreadLimit: 1,// 单步延伸 长度限制
  star: true, // 是否开启 starspread
  // TODO: 目前开启缓存后，搜索会出现一些未知的bug
  cache: true, // 使用缓存, 其实只有搜索的缓存有用，其他缓存几乎无用。因为只有搜索的缓存命中后就能剪掉一整个分支，这个分支一般会包含很多个点。而在其他地方加缓存，每次命中只能剪掉一个点，影响不大。
  window: false, // 启用期望窗口，由于用的模糊比较，所以和期望窗口是有冲突的

  // 调试
  debug: false, // 打印详细的debug信息
}
