/*
 * 产生待选的节点
 * 这个函数的优化非常重要，这个函数产生的节点数，实际就是搜索总数的底数。比如这里平均产生50个节点，进行4层搜索，则平均搜索节点数为50的4次方（在没有剪枝的情况下）
 * 如果能减少产生的节点数，那么能指数级减少搜索时间
 * 如果能对返回的节点排序，先返回优先级高的节点。那么能极大提升剪枝效率，从而缩短计算时间。
 * 目前优化方式：
 * 1. 优先级排序，按估值进行排序
 * 2. 当搜索最后两层的时候，只搜索有相邻邻居的节点
 */

var R = require("./role.js");
var scorePoint = require("./evaluate-point.js");
var hasNeighbor = require("./neighbor.js");
var S = require("./score.js");
var config = require("./config.js");

var gen = function(board, deep) {
  
  var fives = [];
  var fours=[];
  var twothrees=[];
  var threes = [];
  var twos = [];
  var neighbors = [];

  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] == R.empty) {
        if(hasNeighbor(board, [i, j], 2, 2)) { //必须是有邻居的才行
          var scoreHum = scorePoint(board, [i,j], R.hum);
          var scoreCom= scorePoint(board, [i,j], R.com);

          if(scoreCom >= S.FIVE) {//先看电脑能不能连成5
            return [[i, j]];
          } else if(scoreHum >= S.FIVE) {//再看玩家能不能连成5
            //别急着返回，因为遍历还没完成，说不定电脑自己能成五。
            fives.push([i, j]);
          } else if(scoreCom >= S.FOUR) {
            fours.unshift([i,j]);
          } else if(scoreHum >= S.FOUR) {
            fours.push([i,j]);
          } else if(scoreCom >= 2*S.THREE) {
            //能成双三也行
            twothrees.unshift([i,j]);
          } else if(scoreHum >= 2*S.THREE) {
            twothrees.push([i,j]);
          } else if(scoreCom >= S.THREE) {
            threes.unshift([i, j]);
          } else if(scoreHum >= S.THREE) {
            threes.push([i, j]);
          } else if(scoreCom >= S.TWO) {
            twos.unshift([i, j]);
          } else if(scoreHum >= S.TWO) {
            twos.push([i, j]);
          } else {
            neighbors.push([i, j]);
          }
        }
      }
    }
  }

  //如果成五，是必杀棋，直接返回
  if(fives.length) return [fives[0]];
  
  //注意，只要返回第一个即可，如果双方都有活四，则第一个是自己的
  if(fours.length) return [fours[0]];

  //双三很特殊，因为能形成双三的不一定比一个活三强
  if(twothrees.length) {
    return twothrees.concat(threes);
  }

  var result = threes.concat(
      twos.concat(
        neighbors
      )
    );

  if(result.length>config.countLimit) {
    return result.slice(0, config.countLimit);
  }

  return result;
}

module.exports = gen;
