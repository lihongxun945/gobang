var flat = require("./flat");
var R = require("./role");
var eRows = require("./evaluate-rows.js");

var evaluate = function(board) {
  var rows = flat(board);
  var humScore = eRows(rows, R.hum);
  var comScore = eRows(rows, R.com);

  return comScore - humScore;
}

module.exports = evaluate;
