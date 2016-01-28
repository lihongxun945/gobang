(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var flat = require("./flat");
var r = require("./role");

var evaluate = function(board) {
  var rows = flat(board);
  var humScore = eRows(rows, r.hum);
  var comScore = eRows(rows, r.com);

  return comScore - humScore;
}

var eRows = function(rows, role) {
  var r = 0;
  for(var i=0;i<rows.length;i++) {
    r+=eRow(rows[i], role);
  }
  return r;
}

var eRow = function(line, role) {
  var count = 0; // 连子数
  var block = 0; // 封闭数
  var value = 0;  //分数

  for(var i=0;i<line.length;i++) {
    if(line[i] == role) { // 发现第一个己方棋子
      count=1;
      block=0;
      if(i==0) block=1;
      else if(line[i-1] != 0) block = 1;
      for(;i<line.length;i++) {
        if(line[i] == role) count ++
      }
      if(i==line.length || line[i] != 0) block++;
      value += score(count, block);
    }
  }
  return value;
}

var score = function(count, block) {

  if(count >= 5) return 100000;

  if(block === 0) {
    switch(count) {
      case 1: return 10;
      case 2: return 100;
      case 3: return 1000;
      case 4: return 10000;
    }
  }
  if(block === 1) {
    switch(count) {
      case 1: return 1;
      case 2: return 10;
      case 3: return 100;
      case 4: return 1000;
    }
  }

  return 0;
}

module.exports = evaluate;

},{"./flat":2,"./role":3}],2:[function(require,module,exports){
//一维化，把二位的棋盘四个一位数组。
var flat = function(board) {
  var result = [];
  var len = board.length;

  //横向
  for(var i=0;i<len;i++) {
    result.push(board[i]);
  }


  //纵向
  for(var i=0;i<len;i++) {
    var col = [];
    for(var j=0;j<len;j++) {
      col.push(board[j][i]);
    }
    result.push(col);
  }


  // \/ 方向
  for(var i=0;i<len*2;i++) {
    var line = [];
    for(var j=0;j<=i && j<len;j++) {
      if(i-j<len) line.push(board[i-j][j]);
    }
    if(line.length) result.push(line);
  }


  // \\ 方向
  for(var i=-1*len+1;i<len;i++) {
    var line = [];
    for(var j=0;j<len;j++) {
      if(j+i>=0 && j+i<len) line.push(board[j+i][j]);
    }
    if(line.length) result.push(line);
  }

  
  return result;
}

module.exports = flat;

},{}],3:[function(require,module,exports){
module.exports = {
  com: 2,
  hum: 1,
  empty: 0
}

},{}],4:[function(require,module,exports){
var e = require("./evaluate.js");

var b = [
  [0, 0, 0],
  [0, 2, 0],
  [0, 0, 0],
]

console.log(e(b));

b = [
  [0, 0, 0],
  [0, 1, 0],
  [0, 0, 0],
]

console.log(e(b));


b = [
  [0, 2, 0],
  [0, 1, 0],
  [0, 0, 0],
]

console.log(e(b));


b = [
  [0, 1, 0],
  [0, 2, 0],
  [0, 0, 0],
]

console.log(e(b));

},{"./evaluate.js":1}]},{},[4]);
