var AI = require("./ai.js");

var ai = new AI();


onmessage = function(e) {
  var d = e.data;
  if(d.type == "START") {
    ai.start(15);
  } else if(d.type == "GO") {
    var p = ai.set(e.data.x, e.data.y);
    postMessage(p);
  } else if(d.type == "BACK") {
    ai.back();
  }
}
