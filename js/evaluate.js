var flat = require("./flat");
var R = require("./role");
var eRows = require("./evaluate-rows.js");

var evaluate = function(board, role) {
  var rows = flat(board);
  var comScore = eRows(rows, role);
  var humScore = eRows(rows, R.reverse(role));

  return comScore - humScore;
}

module.exports = evaluate;
