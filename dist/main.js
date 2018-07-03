(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
var S = require("./score.js");
var R = require("./role.js");
var W = require("./win.js");
var config = require('./config.js'); //readonly
var messages = require('./messages.js');
var math = require('./math.js');

var Board = function(container, status) {
  this.container = container;
  this.status = status;
  this.step = this.container.width() * 0.065;
  this.offset = this.container.width() * 0.044;
  this.steps = [];  //存储

  this.started = false;


  var self = this;
  this.container.on("click", function(e) {
    if(self.lock || !self.started) return;
    var y = e.offsetX, x = e.offsetY;
    x = Math.floor((x+self.offset)/self.step) - 1;
    y = Math.floor((y+self.offset)/self.step) - 1;

    self.set(x, y, R.hum);
  });

  this.worker = new Worker("./dist/bridge.js?r="+(+new Date()));

  this.worker.onmessage = function(e) {
    var d = e.data;
    self._set(d[0], d[1], R.com);
    self.lock = false;
    var time = (new Date() - self.time)
    self.setStatus("轩轩用时"+(time/1000)+"秒, 评分 " + d.score + ', 搜索深度 ' + d.step);
    self.talk(d, time, d.step)
  }
  this.setStatus("请点击开始按钮");
  this.print(this.rand(messages.greating));
  $(".dialog").click(function () {
    $(".dialog").hide()
  });
}

Board.prototype.start = function() {

  if(this.started) return;
  this.initBoard();
  
  this.draw();

  this.setStatus("欢迎加入五子棋游戏");

  this.started = true;

  this.worker.postMessage({
    type: "START"
  });

  var self = this;

  $.modal({
    title: "请选择选手",
    buttons: [
      {
        text: "轩轩先手",
        onClick: function(){
          self.worker.postMessage({
            type: "BEGIN"
          });
          $(document.body).removeClass('reverse-color')
        }
      },
      {
        text: "玩家先手",
        onClick: function(){
          $(document.body).addClass('reverse-color')
        }
      }
    ]
  });
}

Board.prototype.stop = function() {
  if(!this.started) return;
  this.setStatus("请点击开始按钮");
  this.started = false;
}
Board.prototype.initBoard = function() {
  this.board = [];
  for(var i=0;i<15;i++) {
    var row = [];
    for(var j=0;j<15;j++) {
      row.push(0);
    }
    this.board.push(row);
  }
  this.steps = [];
}

Board.prototype.draw = function() {
  var container = this.container;
  var board = this.board;
  
  container.find(".chessman, .indicator").remove();

  for(var i=0;i<this.steps.length;i++) {
    var chessman = $("<div class='chessman'><span class='nu'>" + (i+1) + "</span></div>").appendTo(container);
    var s = this.steps[i]
    if(this.board[s[0]][s[1]] == 1) chessman.addClass("black");
    chessman.css("top", this.offset + s[0]*this.step);
    chessman.css("left", this.offset + s[1]*this.step);
  }

  if(this.steps.length > 0) {
    var lastStep = this.steps[this.steps.length-1];
    $("<div class='indicator'></div>")
      .appendTo(container)
      .css("top", this.offset + this.step * lastStep[0])
      .css("left", this.offset + this.step * lastStep[1])
  }

}

Board.prototype._set = function(x, y, role) {
  this.board[x][y] = role;
  this.steps.push([x,y]);
  this.draw();
  var winner = W(this.board);
  var self = this;
  if(winner == R.com) {
    $.alert("轩轩赢了！", function() {
      self.stop();
    });
  } else if (winner == R.hum) {
    $.alert("恭喜你赢了！", function() {
      self.stop();
    });
  }
}

Board.prototype.set = function(x, y, role) {
  if(this.board[x][y] !== 0) {
    throw new Error("此位置不为空");
  }
  this._set(x, y, role);
  this.com(x, y, role);
}

Board.prototype.com = function(x, y, role) {
  this.lock = true;
  this.time = new Date();
  this.worker.postMessage({
    type: "GO",
    x: x,
    y: y
  });
  this.setStatus("轩轩正在思考...");
}

Board.prototype.setStatus = function(s) {
  this.status.text(s);
}

Board.prototype.back = function(step) {
  if(this.lock) {
    this.setStatus("轩轩正在思考，请稍等..");
    return;
  }
  step = step || 1;
  while(step && this.steps.length >= 2) {
    var s = this.steps.pop();
    this.board[s[0]][s[1]] = R.empty;
    s = this.steps.pop();
    this.board[s[0]][s[1]] = R.empty;
    step --;
  }
  this.draw();
  this.worker.postMessage({
    type: "BACK"
  });
  this.print(this.rand(messages.back));
}


Board.prototype.setConfig = function(c) {
  this.worker.postMessage({
    type: "CONFIG",
    config: c
  });
}

Board.prototype.talk = function(d, time, step) {
  var score = d.score || 0,
      step = d.step;
  var t;
  var img = '';
  if (this.steps.length <= 3) {
    t = 'opening'
  } else if (score >= S.FIVE * 0.5) {
    t = 'win'
    img = 'haha.gif';
  } else if (score >= S.THREE * 1.5) {
    t = 'superiority'
  } else if (score >= S.THREE * -1.5) {
    t = 'balance'
  } else if (score >= S.FIVE * -0.5) {
    t = 'inferior'
  } else {
    t = 'failed'
    img = 'sad.gif';
  }


  arr = messages[t];
  var msg = this.rand(arr);

  if (img && step === 3) {
    this.pop(img, msg)
  }
  this.print(msg)
  this._lastD = d;
}


Board.prototype.print = function(m) {
  var i=1;
  var b = $(".chat-inner");
  var inter = setInterval(function () {
    if (i>m.length) {
      clearInterval(inter)
      return false
    } else {
      b.text(m.slice(0, i))
    }
    i ++;
  }, 40)
}
Board.prototype.pop = function(img, msg) {
  var $d = $(".dialog");
  var $i = $(".dialog img");
  var $p = $(".dialog p");
  $i.attr("src", '/avatars/' + img);
  $p.text(msg);
  $d.show();

  setTimeout(function () {
    $d.hide();
  }, 5000);
}
Board.prototype.rand = function(arr) {
  return arr[Math.floor(Math.random()*arr.length)]
}


var b = new Board($("#board"), $(".status"));
$("#start").click(function() {
  b.start();
});

$("#fail").click(function() {
  $.confirm("确定认输吗?", function() {
    b.stop();
  });
});

$("#back").click(function() {
  b.back();
});

$('#slider1').slider(function (percent) {
  console.log(percent)
})

// settings
function counter(el, _default, MIN, MAX, cb){
  el.find('input').val(_default)
  el.parents('.weui-cell').find('.range').html(MIN+'~'+MAX)
  el.find('.weui-count__decrease').click(function (e) {
    var $input = $(e.currentTarget).parent().find('.weui-count__number');
    var number = parseInt($input.val() || "0") - 2
    if (number < MIN) number = MIN;
    $input.val(number)
    cb(number)
  })
  el.find('.weui-count__increase').click(function (e) {
    var $input = $(e.currentTarget).parent().find('.weui-count__number');
    var number = parseInt($input.val() || "0") + 2
    if (number > MAX) number = MAX;
    $input.val(number)
    cb(number)
  })
}

counter($('#time'), config.timeLimit, 1, 60, function (n) {
  b.setConfig({
    timeLimit: n
  })
})

counter($('#depth'), config.searchDeep, 6, 14, function (n) {
  b.setConfig({
    searchDeep: n
  })
})
counter($('#breadth'), config.countLimit, 12, 60, function (n) {
  b.setConfig({
    countLimit: n
  })
})
counter($('#vcx'), config.vcxDeep, 0, 12, function (n) {
  b.setConfig({
    vcxDeep: n
  })
})

$("#show-nu").change(function () {
  $(document.body).toggleClass('show-nu')
})

$("#spread").change(function (e) {
  var checked = $(this).is(":checked");
  b.setConfig({
    spreadLimit: checked ? 1 : 0
  })
})

},{"./config.js":1,"./math.js":3,"./messages.js":4,"./role.js":5,"./score.js":6,"./win.js":7}],3:[function(require,module,exports){
var S = require('./score.js');
var threshold = 1.15;

var equal = function(a, b) {
  b = b || 0.01
  return b >= 0 ? ((a >= b / threshold) && (a <= b * threshold))
          : ((a >= b * threshold) && (a <= b / threshold))
}
var greatThan = function(a, b) {
  return b >= 0 ? (a >= (b+0.1) * threshold) : (a >= (b+0.1) / threshold); // 注意处理b为0的情况，通过加一个0.1 做简单的处理
}
var greatOrEqualThan = function(a, b) {
  return equal(a, b) || greatThan(a, b);
}
var littleThan = function(a, b) {
  return b >= 0 ? (a <= (b-0.1) / threshold) : (a <= (b-0.1) * threshold);
}
var littleOrEqualThan = function(a, b) {
  return equal(a, b) || littleThan(a, b);
}

var containPoint = function (arrays, p) {
  for (var i=0;i<arrays.length;i++) {
    var a = arrays[i];
    if (a[0] === p[0] && a[1] === p[1]) return true
  }
  return false
}

var pointEqual = function (a, b) {
  return a[0] === b[0] && a[1] === b[1]
}

var round = function (score) {
  var neg = score < 0 ? -1 : 1;
  var abs = Math.abs(score);
  if (abs <= S.ONE / 2) return 0;
  if (abs <= S.TWO / 2 && abs > S.ONE / 2) return neg * S.ONE;
  if (abs <= S.THREE / 2 && abs > S.TWO / 2) return neg * S.TWO;
  if (abs <= S.THREE * 1.5 && abs > S.THREE / 2) return neg * S.THREE;
  if (abs <= S.FOUR / 2 && abs > S.THREE * 1.5) return neg * S.THREE*2;
  if (abs <= S.FIVE / 2 && abs > S.FOUR / 2) return neg * S.FOUR;
  return neg * S.FIVE;
}

module.exports = {
  equal: equal,
  greatThan: greatThan,
  greatOrEqualThan: greatOrEqualThan,
  littleThan: littleThan,
  littleOrEqualThan: littleOrEqualThan,
  containPoint: containPoint,
  pointEqual: pointEqual,
  round: round
}

},{"./score.js":6}],4:[function(require,module,exports){
module.exports = {
  greating: [
    '你好~我是轩轩~',
    'Hello~Nice to meet you~',
    '欢迎欢迎，热烈欢迎~',
    '来切磋下~',
  ],
  thinking: [
    '容我想一想~',
    '别打扰我哦，我会生气的',
  ],
  opening: [
    '开局随便走走就好啦~',
    '我没有开局库的哦~',
    '开局走错，满盘皆输~',
    '哎呀，不会落地成盒把~',
    '我这个开局是放水哦~',
    '放心，我不会走必胜开局的~',
    '悄悄给你演示下必胜开局~',
  ],
  superiority: [
    '目前形势一片大好',
    '一切尽在掌握之中~',
    '夜观天象，吉星高照~',
    '怕不怕？~~~',
    'AlphaGO 都不是我对手',
  ],
  balance: [
    '形势很胶着~',
    '不知道怎么走了，随便走走~',
    '好的局面需要慢慢酝酿~',
    '只要功夫深，铁杵磨成针~',
    '我也在学习怎么下棋~',
    '本宫最近心情好，让你一颗子~',
    '绿的是小草，红的是花朵，想的是你~',
    '其实我也会下围棋，打算跟AlphaGo切磋下棋艺~',
    '你知道GomoCup吗，我打算明年参赛',
    '昨天练了一整晚，好困啊~',
    '功夫再高，也怕菜刀~',
    '我们没有双三禁手哦~',
    '告诉你一个小技巧:*****.',
    '给我发红包，我教你怎么下',
    '跟我下棋要收费的哦~',
    '你知道长草颜团子吗，萌萌哒',
    '棋海无涯，回头是岸',
    '我正在研究神经网络~',
    '其实代码还有bug，你还有机会赢',
    '我赢了是实力碾压，你赢了是出bug了',
    '其实我是个机器人',
    '别乱调参数哦，可能会卡死的',
    'CPU速度越快我就越厉害，怕不怕?',
    '你知道八卦阵么',
    '手机上玩别切出去，不然思考会暂停的',
  ],
  inferior: [
    '形势不容乐观~',
    '不会输了吧~',
    '感觉要GG了~',
    '难道本宝宝要第一次输棋了~',
    '不可能不可能~',
  ],
  failed: [
    '哎呀~感觉快输了~',
    '宝宝不开心~~',
    '这不是真的~~',
    '再来，我要赢!!',
    '既生瑜，何生亮~~~~',
    '围棋你肯定下不过我',
  ],
  win: [
    '如此轻松随意~',
    '太无聊了，能不能来个厉害的对手',
    '小朋友回家多多练习哦',
    '每次都是这么简单',
    '已经超神了~',
    '驰骋沙场，未尝败绩~',
    '鸟方横着走，从来不看路~',
    '虐菜局，没意思~',
  ],
  back: [
    '你好坏哦~',
    '再悔棋我生气了~',
    '悔棋算你输哦~',
    '等我我下错了也悔棋~',
  ]
}

},{}],5:[function(require,module,exports){
module.exports = {
  com: 1,
  hum: 2,
  empty: 0,
  reverse: function(r) {
    return r == 1 ? 2 : 1;
  }
}

},{}],6:[function(require,module,exports){
/*
 * 棋型表示
 * 用一个6位数表示棋型，从高位到低位分别表示
 * 连五，活四，眠四，活三，活二/眠三，活一/眠二, 眠一
 */

// 给单个棋型打分

module.exports = {
  ONE: 10,
  TWO: 100,
  THREE: 1000,
  FOUR: 100000,
  FIVE: 10000000,
  BLOCKED_ONE: 1,
  BLOCKED_TWO: 10,
  BLOCKED_THREE: 100,
  BLOCKED_FOUR: 10000
}

// 总分数
var score = {
  TWO: 'TWO', // 活二
  TWO_THREE: 'TWO_THREE', // 双三
  BLOCK_FOUR: 'BLOCKED_FOUR', // 冲四
  FOUR_THREE: 'FOUR_THREE', // 冲四活三
  FOUR: 'FOUR', // 活四
  FIVE: 'FIVE', // 连五
}

},{}],7:[function(require,module,exports){
var R = require("./role.js");
var isFive = function(board, p, role) {
  var len = board.length;
  var count = 1;

  var reset = function() {
    count = 1;
  }

  for(var i=p[1]+1;true;i++) {
    if(i>=len) break;
    var t = board[p[0]][i];
    if(t !== role) break;
    count ++;
  }


  for(var i=p[1]-1;true;i--) {
    if(i<0) break;
    var t = board[p[0]][i];
    if(t !== role) break;
    count ++;
  }

  if(count >= 5) return true;

  //纵向
  reset();

  for(var i=p[0]+1;true;i++) {
    if(i>=len) {
      break;
    }
    var t = board[i][p[1]];
    if(t !== role) break;
    count ++;
  }

  for(var i=p[0]-1;true;i--) {
    if(i<0) {
      break;
    }
    var t = board[i][p[1]];
    if(t !== role) break;
    count ++;
  }


  if(count >= 5) return true;
  // \\
  reset();

  for(var i=1;true;i++) {
    var x = p[0]+i, y = p[1]+i;
    if(x>=len || y>=len) {
      break;
    }
    var t = board[x][y];
    if(t !== role) break;
      
    count ++;
  }

  for(var i=1;true;i++) {
    var x = p[0]-i, y = p[1]-i;
    if(x<0||y<0) {
      break;
    }
    var t = board[x][y];
    if(t !== role) break;
    count ++;
  }

  if(count >= 5) return true;

  // \/
  reset();

  for(var i=1; true;i++) {
    var x = p[0]+i, y = p[1]-i;
    if(x<0||y<0||x>=len||y>=len) {
      break;
    }
    var t = board[x][y];
    if(t !== role) break;
    count ++;
  }

  for(var i=1;true;i++) {
    var x = p[0]-i, y = p[1]+i;
    if(x<0||y<0||x>=len||y>=len) {
      break;
    }
    var t = board[x][y];
    if(t !== role) break;
    count ++;
  }

  if(count >= 5) return true;

  return false;

}


var w = function(board) {
  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      var t = board[i][j];
      if(t !== R.empty) {
        var r = isFive(board, [i, j], t);
        if(r) return t;
      }
    }
  }
  return false;
}

module.exports = w;

},{"./role.js":5}]},{},[2]);
