var R = require("./role");
var T = SCORE = require("./score.js");
var math = require("./math.js");
var checkmate = require("./checkmate.js");
var config = require("./config.js");
var debug = require("./debug.js");
var board = require("./board.js");

var MAX = SCORE.FIVE*10;
var MIN = -1*MAX;

var total=0, //总节点数
    steps=0,  //总步数
    count,  //每次思考的节点数
    PVcut,
    ABcut,  //AB剪枝次数
    cacheCount=0, //zobrist缓存节点数
    cacheGet=0; //zobrist缓存命中数量

var Cache = {};

var checkmateDeep = config.checkmateDeep;

/*
 * max min search
 * white is max, black is min
 */

var negamax = function(deep, _checkmateDeep) {
  var best = MIN;
  var points = board.gen();
  var bestPoints = [];

  count = 0;
  ABcut = 0;
  PVcut = 0;
  checkmateDeep = (_checkmateDeep == undefined ? checkmateDeep : _checkmateDeep);

  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board.put(p, R.com);
    var v = - r(deep-1, -MAX, -best, R.hum);

    //边缘棋子的话，要把分数打折，避免电脑总喜欢往边上走
    if(p[0]<3 || p[0] > 11 || p[1] < 3 || p[1] > 11) {
      v = .5 * v;
    }

    //console.log(v, p);
    //如果跟之前的一个好，则把当前位子加入待选位子
    if(math.equal(v, best)) {
      bestPoints.push(p);
    }
    //找到一个更好的分，就把以前存的位子全部清除
    if(math.greatThan(v, best)) {
      best = v;
      bestPoints = [];
      bestPoints.push(p);
    }


    board.remove(p);
  }
  config.log && console.log("分数:"+best.toFixed(3)+", 待选节点:"+JSON.stringify(bestPoints));
  var result = bestPoints[Math.floor(bestPoints.length * Math.random())];
  result.score = best;
  steps ++;
  total += count;
  config.log && console.log('搜索节点数:'+ count+ ',AB剪枝次数:'+ABcut + ', PV剪枝次数:' + PVcut + ', 缓存命中:' + (cacheGet / cacheCount).toFixed(3) + ',' + cacheGet + '/' + cacheCount + ',算杀缓存命中:' + (debug.checkmate.cacheGet / debug.checkmate.cacheCount).toFixed(3) + ',' + debug.checkmate.cacheGet + '/'+debug.checkmate.cacheCount); //注意，减掉的节点数实际远远不止 ABcut 个，因为减掉的节点的子节点都没算进去。实际 4W个节点的时候，剪掉了大概 16W个节点
  config.log && console.log('当前统计：总共'+ steps + '步, ' + total + '个节点, 平均每一步' + Math.round(total/steps) +'个节点');
  config.log && console.log("================================");
  return result;
}

var r = function(deep, alpha, beta, role) {

  if(config.cache) {
    var c = Cache[board.zobrist.code];
    if(c) {
      if(c.deep >= deep) {
        cacheGet ++;
        return c.score;
      }
    }
  }

  var v = board.evaluate(role);
  count ++;
  if(deep <= 0 || math.greatOrEqualThan(v, T.FIVE)) {
    return v;
  }
  
  var best = MIN;
  var points = board.gen();

  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board.put(p, role);

    var v = - r(deep-1, -beta, -1 *( best > alpha ? best : alpha), R.reverse(role)) * config.deepDecrease;
    board.remove(p);

    if(math.greatThan(v, best)) {
      best = v;
    }
    if(math.greatOrEqualThan(v, beta)) { //AB 剪枝
      ABcut ++;
      cache(deep, v);
      return v;
    }
  }
  if( (deep == 2 || deep == 3 ) && math.littleThan(best, SCORE.THREE*2) && math.greatThan(best, SCORE.THREE * -1) & role === R.com) {
    var mate = checkmate(role, checkmateDeep);
    if(mate) {
      var score = mate.score * Math.pow(.8, mate.length);
      cache(deep, score);
      return score;
    }
  }
  cache(deep, best);
  
  return best;
}

var cache = function(deep, score) {
  if(!config.cache) return;
  Cache[board.zobrist.code] = {
    deep: deep,
    score: score
  }
  cacheCount ++;
}

var deeping = function(deep) {
  deep = deep === undefined ? config.searchDeep : deep;
  //迭代加深
  //注意这里不要比较分数的大小，因为深度越低算出来的分数越不靠谱，所以不能比较大小，而是是最高层的搜索分数为准
  var result;
  for(var i=2;i<=deep; i+=2) {
    result = negamax(i);
    if(math.greatOrEqualThan(result.score, SCORE.FOUR)) return result;
  }
  return result;
}
module.exports = deeping;
