module.exports = {
  searchDeep: 4,  //搜索深度
  deepDecrease: .8, //按搜索深度递减分数，为了让短路径的结果比深路劲的分数高
  countLimit: 12, //gen函数返回的节点数量上限，超过之后将会按照分数进行截断
  checkmateDeep:  7,  //算杀深度
}
