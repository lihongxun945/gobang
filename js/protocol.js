var AI = require("./ai.js");
var readline = require('readline');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

var ai = new AI();

var boardMode = false;

rl.on('line', function(line){
  var args = line.split(" ");
  if(args[0] === "BEGIN") {
    var r = ai.begin();
    console.log(r.join(","));
  } else if(args[0] === "START") {
    var size = args[1] ? parseInt(args[1]) : 20;
    ai.start(size);
    console.log("OK");
  } else if (args[0] === "TURN") {
    var p = args[1].split(",");
    var r = ai.turn(parseInt(p[0]), parseInt(p[1]));
    console.log(r.join(","));
  } else if(line == "BOARD") {
    boardMode = true;
  } else if(line == "DONE") {
    boardMode = false;
    var r = ai.begin();
    console.log(r.join(","))
  } else if(boardMode) {
    var t = line.split(",");
    ai.set(parseInt(t[0]), parseInt(t[1]), parseInt(t[2])); 
  }
})
