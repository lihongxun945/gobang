var R = require("./role");
var T = SCORE = require("./score.js");
var math = require("./math.js");
var vcx = require("./vcx.js");
var config = require("./config.js");
var debug = require("./debug.js");
var board = require("./board.js");

var MAX = SCORE.FIVE*10;
var MIN = -1*MAX;

var steps=0,  //总步数
    count=0,  //每次思考的节点数
    PVcut,
    ABcut,  //AB剪枝次数
    cacheCount=0, //zobrist缓存节点数
    cacheGet=0; //zobrist缓存命中数量

var Cache = {};

var checkmateDeep;

/*
 * max min search
 * white is max, black is min
 */

var negamax = function(deep, _checkmateDeep) {
  var points = board.gen();
  var bestPoints = [];
  var start = new Date();

  count = 0;
  ABcut = 0;
  PVcut = 0;
  checkmateDeep = (_checkmateDeep == undefined ? config.checkmateDeep : _checkmateDeep);

  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board.put(p, R.com);
    // 越靠后的点，搜索深度约低，因为出现好棋的可能性比较小
    var _deep = deep-1; // 前6个
    if (i > 5) _deep = deep - 3; // 7~*
    var v = r(_deep, -MAX, -MIN, R.hum, 1);
    v.score *= -1
    board.remove(p);
    console.log(p, v)
    p.v = v
  }
  //排序
  points.sort(function (a,b) {
    if (math.equal(a.v.score,b.v.score)) {
      // 大于零是优势，尽快获胜，因此取步数短的
      // 小于0是劣势，尽量拖延，因此取步数长的
      if (a.v.score >= 0) return a.v.step - b.v.step
      else return b.v.step - a.v.step
    }
    else return (b.v.score - a.v.score)
  })
  var best = points[0];
  bestPoints = points.filter(function (p) {
    return math.greatOrEqualThan(p.v.score, best.v.score) && p.v.step === best.v.step
  });
  var result = points[0];
  result.score = points[0].v.score;
  result.step = points[0].v.step;
  config.log && console.log("可选节点：" + bestPoints.join(';'));
  config.log && console.log("选择节点：" + points[0] + ", 分数:"+result.score.toFixed(3)+", 步数:" + result.step);
  steps ++;
  var time = (new Date() - start)/1000
  config.log && console.log('搜索节点数:'+ count+ ',AB剪枝次数:'+ABcut + ', PV剪枝次数:' + PVcut + ', 缓存命中:' + (cacheGet / cacheCount).toFixed(3) + ',' + cacheGet + '/' + cacheCount + ',算杀缓存命中:' + (debug.checkmate.cacheGet / debug.checkmate.cacheCount).toFixed(3) + ',' + debug.checkmate.cacheGet + '/'+debug.checkmate.cacheCount); //注意，减掉的节点数实际远远不止 ABcut 个，因为减掉的节点的子节点都没算进去。实际 4W个节点的时候，剪掉了大概 16W个节点
  config.log && console.log('当前统计：总共'+ steps + '步, ' + count + '个节点, 耗时:' + time.toFixed(2) + 's, 平均每一步' + Math.round(count/steps) +'个节点, NPS:' + Math.floor(count/ time) + 'N/S');
  config.log && console.log("================================");
  return result;
}

var r = function(deep, alpha, beta, role, step) {

  if(config.cache) {
    var c = Cache[board.zobrist.code];
    if(c) {
      if(c.deep >= deep) {
        cacheGet ++;
        return c.score;
      }
    }
  }

  var _e = board.evaluate(role);

  count ++;
  if(deep <= 0 || math.greatOrEqualThan(_e, T.FIVE)) {
    return {
      score: _e,
      step: step
    };
  }
  
  var best = {
    score: MIN,
    step: step
  }
  var points = board.gen(true);

  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board.put(p, role);

    var v = r(deep-1, -beta, -1 *( best.score > alpha ? best.score : alpha), R.reverse(role), step+1);
    v.score *= -1;
    board.remove(p);

    if(math.greatThan(v.score, best.score)) {
      best = v;
    }
    if(math.greatOrEqualThan(v.score, beta)) { //AB 剪枝
      ABcut ++;
      cache(deep, v);
      return v;
    }
  }
  // vcf
  // 自己没有形成活四，对面也没有高于冲四的棋型，那么先尝试VCF
  if(math.littleThan(best.score, SCORE.FOUR) && math.greatThan(best.score, SCORE.BLOCKED_FOUR * -2)) {
    var mate = vcx.vcf(role, checkmateDeep);
    if(mate) {
      var score = mate.score;
      cache(deep, score);
      return {
        score: score,
        step: step + mate.length
      }
    }
  }
  // vct
  // 自己没有形成活三，对面也没有高于活三的棋型，那么尝试VCT
  if(math.littleThan(best.score, SCORE.THREE*2) && math.greatThan(best.score, SCORE.THREE * -2)) {
    var mate = vcx.vct(role, checkmateDeep);
    if(mate) {
      var score = mate.score;
      cache(deep, score);
      return {
        score: score,
        step: step + mate.length
      }
    }
  }
  cache(deep, best);
  
  //console.log('end: role:' + role + ', deep:' + deep + ', best: ' + best)
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
