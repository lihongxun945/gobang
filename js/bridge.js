var AI = require("./ai.js");
var R = require("./role.js");

var ai = new AI();


onmessage = function(e) {
  var d = e.data;
  if(d.type == "START") {
    ai.start(15);
    ai.set(7,7,R.com);
  } else if(d.type == "GO") {
    var p = ai.turn(e.data.x, e.data.y);
    postMessage(p);
  } else if(d.type == "BACK") {
    ai.back();
  }
}
