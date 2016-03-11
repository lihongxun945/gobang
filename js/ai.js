var m = require("./negamax.js");
var R = require("./role.js");
var zobrist = require("./zobrist.js");
var config = require("./config.js");
var board = require("./board.js");

var AI = function() {
  this.steps = [];
}

AI.prototype.start = function(size) {
  board.init(size);
}

AI.prototype.set = function(x, y) {
  board.put([x,y], R.hum, true);
  var p = m(config.searchDeep);
  board.put(p, R.com, true);
  return p;
}

AI.prototype.back = function() {
  board.back();
}
module.exports = AI;
