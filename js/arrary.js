module.exports = {
  create: function (w, h) {
    var r = []
    for(var i=0;i<w;i++) {
      var row = new Array()
      for(var j=0;j<h;j++) {
        row.push(0)
      }
      r.push(row)
    }
    return r
  }
}
