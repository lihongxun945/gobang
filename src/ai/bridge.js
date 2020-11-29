import AI from "./ai.js"
import R from "./role.js"
import config from './config.js'

var ai = new AI()

self.onmessage = function(e) {
  var d = e.data
  console.log('get message: ')
  console.log(d)
  if(d.type == "START") {
    const open = ai.start(d.first, d.randomOpening)
    postMessage({
      type: 'board',
      data: open
    })
  } else if(d.type == "BEGIN") {
    var p = ai.begin()
    postMessage({
      type: 'put',
      data: p
    })
  } else if(d.type == "GO") {
    var p = ai.turn(e.data.x, e.data.y)
    postMessage({
      type: 'put',
      data: p
    })
  } else if(d.type == "BACKWARD") {
    ai.backward()
  } else if(d.type == "FORWARD") {
    ai.forward()
  } else if(d.type == "CONFIG") {
    var d = e.data.config
    if (d.searchDeep) config.searchDeep = d.searchDeep
    if (d.countLimit) config.countLimit = d.countLimit
    if (d.vcxDeep) config.vcxDeep = d.vcxDeep
    if (d.timeLimit) config.timeLimit = d.timeLimit
    if (d.spread !== undefined) config.spreadLimit = d.spread
  }
}
