var m = require("./negamax.js");

onmessage = function(e) {
  var p = m(e.data.board, e.data.deep);
  postMessage(p);
}
