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
