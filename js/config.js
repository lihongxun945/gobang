module.exports = {
  searchDeep: 6,  //搜索深度
  deepDecrease: .8, //按搜索深度递减分数，为了让短路径的结果比深路劲的分数高
  countLimit: 8, //gen函数返回的节点数量上限，超过之后将会按照分数进行截断
  checkmateDeep:  5,  //算杀深度
  cache: false,  //是否使用效率不高的置换表
}
