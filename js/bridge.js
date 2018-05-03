var AI = require("./ai.js");
var R = require("./role.js");
var config = require('./config.js');

var ai = new AI();

onmessage = function(e) {
  var d = e.data;
  if(d.type == "START") {
    ai.start(15);
  } else if(d.type == "BEGIN") {
    var p = ai.begin();
    postMessage(p);
  } else if(d.type == "GO") {
    var p = ai.turn(e.data.x, e.data.y);
    postMessage(p);
  } else if(d.type == "BACK") {
    ai.back();
  } else if(d.type == "CONFIG") {
    var d = e.data.config
    if (d.searchDeep) config.searchDeep = d.searchDeep
    if (d.countLimit) config.countLimit = d.countLimit
    if (d.checkmateDeep) config.checkmateDeep = d.checkmateDeep
  }
}
