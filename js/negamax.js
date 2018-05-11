/*
 * 思路：
 * 每次开始迭代前，先生成一组候选列表，然后在迭代加深的过程中不断更新这个列表中的分数
 * 这样迭代的深度越大，则分数越精确，并且，任何时候达到时间限制而中断迭代的时候，能保证这个列表中的分数都是可靠的
 */
var R = require("./role");
var T = SCORE = require("./score.js");
var math = require("./math.js");
var vcx = require("./vcx.js");
var config = require("./config.js");
var debug = require("./debug.js");
var board = require("./board.js");

var MAX = SCORE.FIVE*10;
var MIN = -1*MAX;

var bestScore;

var count=0,  //每次思考的节点数
    PVcut,
    ABcut,  //AB剪枝次数
    cacheCount=0, //zobrist缓存节点数
    cacheGet=0; //zobrist缓存命中数量

var candidates; 

var Cache = {};

var vcxDeep;
var startTime; // 开始时间，用来计算每一步的时间
var allBestPoints; // 记录迭代过程中得到的全部最好点

/*
 * max min search
 * white is max, black is min
 */

var negamax = function(deep, _vcxDeep) {

  count = 0;
  ABcut = 0;
  PVcut = 0;
  vcxDeep = (_vcxDeep == undefined ? config.vcxDeep : _vcxDeep);

  if (candidates[0].level > 1) {
    // 最大值就是能成活二的，这时0.x秒就搜索完了，增加深度以充分利用时间
    deep += 2
  }

  for(var i=0;i<candidates.length;i++) {
    var p = candidates[i];
    board.put(p, R.com);
    // 越靠后的点，搜索深度约低，因为出现好棋的可能性比较小
    var v = r(deep-(p.level||1), -MAX, -bestScore, R.hum, 1);
    v.score *= -1
    bestScore = Math.max(bestScore, v.score)
    board.remove(p);
    p.v = v

    // 超时判定
    if ((+ new Date()) - start > config.timeLimit * 1000) {
      console.log('timeout...');
      break; // 超时，退出循环
    }
  }

  console.log('迭代完成,deep=' + deep)
  console.log(candidates.map(function (d) {
    return '['+d[0]+','+d[1]+']' + ',score:' + d.v.score + ',step:' + d.v.step + (d.v.vct ? (',vct:' + d.v.vct) : '') + (d.v.vcf ? (',vcf:' + d.v.vcf) : '')
  }))

}

var r = function(deep, alpha, beta, role, step) {

  if(config.cache) {
    var c = Cache[board.zobrist.code];
    if(c) {
      if(c.deep >= deep) { // 如果缓存中的结果搜索深度不比当前小，则结果完全可用
        cacheGet ++;
        return c.score;
      } else {
        // 如果缓存的结果中搜索深度比当前小，那么任何一方出现双三及以上结果的情况下可用
        // TODO: 只有这一个缓存策略是会导致开启缓存后会和以前的结果有一点点区别的，其他几种都是透明的缓存策略
        if (math.greatOrEqualThan(c.score, SCORE.THREE * 2) || math.littleOrEqualThan(c.score, SCORE.THREE * -2)) {
          cacheGet ++;
          return c.score;
        }
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
  var points = board.gen(role);

  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board.put(p, role);

    var _deep = deep-(p.level||1);

    // 冲四延伸
    if ( (role == R.com && p.scoreHum >= SCORE.FIVE) ||
      (role == R.hum && p.scoreCom >= SCORE.FIVE)) _deep = deep

    var v = r(_deep, -beta, -alpha, R.reverse(role), step+1);
    v.score *= -1;
    board.remove(p);
    alpha = Math.max(best.score, alpha);

    if(math.greatThan(v.score, best.score)) {
      best = v;
    }
    //AB 剪枝
    // 这里不要直接返回原来的值，因为这样上一层会以为就是这个分，实际上这个节点直接剪掉就好了，根本不用考虑，也就是直接给一个很大的值让他被减掉
    // 这样会导致一些差不多的节点都被剪掉，但是没关系，不影响棋力
    // 其实被注释的这行会有更稳定的剪枝表现，但是这样会导致速度很慢
    // if(math.greatOrEqualThan(v.score, beta) && v.score >= T.THREE) {
    if(math.greatOrEqualThan(v.score, beta)) {
      ABcut ++;
      if (math.greatThan(v.score, beta) && v.score >= T.THREE * 2) v.score = MAX-1; // 被剪枝的，直接用一个极小值来记录
      v.abcut = 1; // 剪枝标记
      cache(deep, v);
      return v;
    }
  }
  // 经过测试，把算杀放在对子节点的搜索之后，比放在前面速度更快一些。
  // vcf
  // 自己没有形成活四，对面也没有形成活四，那么先尝试VCF
  if(math.littleThan(best.score, SCORE.FOUR) && math.greatThan(best.score, SCORE.FOUR * -1)) {
    var mate = vcx.vcf(role, vcxDeep);
    if(mate) {
      var _r = {
        score: mate.score,
        step: step + mate.length,
        vcf: mate.length // 一个标记为，表示这个值是由vcx算出的
      }
      cache(deep, _r);
      return _r;
    }
  }
  // vct
  // 自己没有形成活三，对面也没有高于活三的棋型，那么尝试VCT
  if(math.littleThan(best.score, SCORE.THREE*2) && math.greatThan(best.score, SCORE.THREE * -2)) {
    var mate = vcx.vct(role, vcxDeep);
    if(mate) {
      var _r = {
        score: mate.score,
        step: step + mate.length,
        vct: mate.length // 一个标记为，表示这个值是由vcx算出的
      }
      cache(deep, _r);
      return _r;
    }
  }
  cache(deep, best);
  
  //console.log('end: role:' + role + ', deep:' + deep + ', best: ' + best)
  return best;
}

var cache = function(deep, score) {
  if(!config.cache) return;
  if (score.abcut) return; // 被剪枝的暂时不缓存
  Cache[board.zobrist.code] = {
    deep: deep,
    score: score
  }
  cacheCount ++;
}

var deeping = function(deep) {
  candidates = board.gen(R.com);
  start = (+ new Date())
  bestScore = MIN;
  deep = deep === undefined ? config.searchDeep : deep;

  var result;

  //迭代加深
  for(var i=2;i<=deep; i+=2) {
    negamax(i);
    // 每次迭代剔除必败点，直到没有必败点或者只剩最后一个点
    // 实际上，由于必败点几乎都会被AB剪枝剪掉，因此这段代码几乎不会生效
    var newCandidates = candidates.filter(function (d) {
      return math.round(d.v.score) > SCORE.THREE * -2;
    })
    candidates = newCandidates.length ? newCandidates : [candidates[0]]; // 必败了，随便走走

    if (bestScore < T.THREE * 2) bestScore = MIN; // 如果能找到双三以上的棋，则保留bestScore做剪枝，否则直接设置为最小值
  }

  // 美化一下
  candidates = candidates.map(function (d) {
    var r = [d[0], d[1]]
    r.score = d.v.score
    r.step = d.v.step
    if (d.v.vct) r.vct = d.v.vct
    if (d.v.vcf) r.vcf = d.v.vcf
    return r;
  })

  // 排序
  // 经过测试，这个如果放在上面的for循环中（就是每次迭代都排序），反而由于迭代深度太浅，排序不好反而会降低搜索速度。
  candidates.sort(function (a,b) {
    if (math.equal(a.score,b.score)) {
      // 大于零是优势，尽快获胜，因此取步数短的
      // 小于0是劣势，尽量拖延，因此取步数长的
      if (a.score >= 0) {
        if (a.step !== b.step) return a.step - b.step
        else return b.score - a.score // 否则 选取当前分最高的（直接评分)
      }
      else {
        if (a.step !== b.step) return b.step - a.step
        else return b.score - a.score // 否则 选取当前分最高的（直接评分)
      }
    }
    else return (b.score - a.score)
  })

  var best = candidates[0];
  bestPoints = candidates.filter(function (p) {
    return math.greatOrEqualThan(p.score, best.score) && p.step === best.step
  });
  var result = candidates[0];
  config.log && console.log("可选节点：" + bestPoints.join(';'));
  config.log && console.log("选择节点：" + candidates[0] + ", 分数:"+result.score.toFixed(3)+", 步数:" + result.step);
  var time = (new Date() - start)/1000
  config.log && console.log('搜索节点数:'+ count+ ',AB剪枝次数:'+ABcut + ', PV剪枝次数:' + PVcut);
  config.log && console.log('搜索缓存:' + '总数 ' + cacheCount + ', 命中率 ' + (cacheGet / cacheCount * 100).toFixed(3) + '%, ' + cacheGet + '/' + cacheCount)
  config.log && console.log('算杀缓存:' + '总数 ' + debug.checkmate.cacheCount + ', 命中:' + (debug.checkmate.cacheHit / debug.checkmate.totalCount * 100).toFixed(3) + '% ,' + debug.checkmate.cacheHit + '/'+debug.checkmate.totalCount);
  //注意，减掉的节点数实际远远不止 ABcut 个，因为减掉的节点的子节点都没算进去。实际 4W个节点的时候，剪掉了大概 16W个节点
  config.log && console.log('当前统计：' + count + '个节点, 耗时:' + time.toFixed(2) + 's, NPS:' + Math.floor(count/ time) + 'N/S');
  config.log && console.log("================================");
  return result;
}
module.exports = deeping;
