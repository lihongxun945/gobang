module.exports = {
  searchDeep: 4,  //搜索深度
  deepDecrease: .8, //每深入一层，同样的分数会打一个折扣
  countLimit: 10, //gen函数返回的节点数量上限，超过之后将会按照分数进行截断
  checkmateDeep:  9,  //算杀深度
}
