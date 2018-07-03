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
