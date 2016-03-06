var Zobrist = require("../js/zobrist.js");

var ZMap = function() {
}

ZMap.prototype.init = function() {
  this.zobrist = new Zobrist();
  this.zobrist.init();
  this.map = {};
}

ZMap.prototype.get = function() {
}

ZMap.prototype.set = function() {
}
