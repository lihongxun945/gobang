var eRow = require("./evaluate-row.js");

var eRows = function(rows, role) {
  var r = 0;
  var scores = [];
  for(var i=0;i<rows.length;i++) {
    var s = eRow(rows[i], role);
    scores.push(s);
    r+= s;
  }
  return r;
}

module.exports = eRows;
