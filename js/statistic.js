var array = require("./arrary.js");

function Statistic() {
}

Statistic.prototype.init = function (size) {
  this.table = array.create(size, size);
}

Statistic.prototype.print = function (candidates) {
  console.log(this.table.map(function (r) { return r.map(i=>parseInt(Math.sqrt(i/10000))).join(',') }))
  var max = 0;
  var p;
  for (var i=0; i<candidates.length; i++) {
    var c = candidates[i];
    var s = this.table[c[0]][c[1]];
    if (s > max) {
      max = s;
      p = [c[0], c[1]];
    }
  }
  console.log('历史表推荐走法:', p);
}

module.exports = new Statistic()
