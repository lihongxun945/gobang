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
var S = require("./score.js");

var gen = function(board, deep) {
  
  var four;
  var twothree;
  var threes = [];
  var twos = [];
  var neighbors = [];
  var nextNeighbors = [];
  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] == R.empty) {
        if(hasNeighbor(board, [i, j], 1, 1)) { //必须是有邻居的才行
          //永远是先看电脑的利益，再看同一层级下玩家的利益。
          var scoreHum = scorePoint(board, [i,j], R.hum);
          var scoreCom= scorePoint(board, [i,j], R.com);


          //对必杀好棋，只要发现就直接返回，不用遍历其他节点。
          //必杀好棋为：成五，活四，双三。
          //只要出现这三种情况，直接返回。
          //否则就返回所有可能的节点。
          //如果当前可以成五，则直接赢，没必要算其他节点
          //
          //注意一个容易犯的错误：不要碰到了必杀棋直接返回，比如碰到双三直接返回是不对的，因为后面有可能还有成五的情况，所以要先存起来。
          //只有碰到五才能直接返回，对于活四和双三都要存起来。不能因为碰到活四就直接返回而漏掉了后面可能出现的五
          if(scoreCom >= S.FIVE) {//先看电脑能不能连成5
            return [[i, j]];
          } else if(scoreHum >= S.FIVE) {//再看玩家能不能连成5
            return [[i, j]];
          } else if(scoreCom >= S.FOUR) {
            //进到这里说明不能成五，那么只要能成活四，也没有必要算其他的节点。
            four = [i,j];
          } else if(scoreHum >= S.FOUR) {
            if(!four) four = [i,j];
          } else if(scoreCom >= 2*S.THREE) {
            //能成双三也行
            twothree = [i,j];
          } else if(scoreHum >= 2*S.THREE) {
            if(!twothree) twothree = [i,j];
          }
        }
      }
    }
  }

  if(four) return [four];
  if(twothree) return [twothree];

  //没有必杀棋，就看看其他的棋有没有可以走的
  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] == R.empty) {
        if(hasNeighbor(board, [i, j], 1, 1)) { //必须是有邻居的才行
          var scoreHum = scorePoint(board, [i,j], R.hum);
          var scoreCom= scorePoint(board, [i,j], R.com);
          if(scoreCom >= S.THREE) {
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
        } else if(deep >= 2 && hasNeighbor(board, [i, j], 2, 2)) {
          nextNeighbors.push([i, j]);
        }
      }
    }
  }

  return threes.concat(
    twos.concat(
      neighbors.concat(nextNeighbors)
    )
  );
}

//有邻居
var hasNeighbor = function(board, point, distance, count) {
  var len = board.length;
  var startX = point[0]-distance;
  var endX = point[0]+distance;
  var startY = point[1]-distance;
  var endY = point[1]+distance;
  for(var i=startX;i<=endX;i++) {
    if(i<0||i>=len) continue;
    for(var j=startY;j<=endY;j++) {
      if(j<0||j>=len) continue;
      if(i==point[0] && j==point[1]) continue;
      if(board[i][j] != R.empty) {
        count --;
        if(count <= 0) return true;
      }
    }
  }
  return false;
}


module.exports = gen;
