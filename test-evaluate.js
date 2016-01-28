var e = require("./evaluate.js");

var b = [
  [0, 0, 0],
  [0, 1, 0],
  [0, 0, 0],
]

console.log(e(b, 1));
console.log(e(b, 2));


var c = [
  [0, 1, 0],
  [0, 1, 0],
  [0, 0, 0],
]

console.log(e(c, 1));
console.log(e(c, 2));

var d = [
  [0, 0, 0, 0],
  [0, 1, 1, 0],
  [0, 1, 1, 0],
  [0, 0, 0, 0],
]
console.log(e(d, 1));
console.log(e(d, 2));
