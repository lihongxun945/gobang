import R from "./role.js"
var isFive = function(board, p, role) {
  var len = board.length;
  var count = 1;

  var reset = function() {
    count = 1;
  }

  for(var i=p[1]+1;true;i++) {
    if(i>=len) break;
    var t = board[p[0]][i];
    if(t !== role) break;
    count ++;
  }


  for(var i=p[1]-1;true;i--) {
    if(i<0) break;
    var t = board[p[0]][i];
    if(t !== role) break;
    count ++;
  }

  if(count >= 5) return 1;

  //纵向
  reset();

  for(var i=p[0]+1;true;i++) {
    if(i>=len) {
      break;
    }
    var t = board[i][p[1]];
    if(t !== role) break;
    count ++;
  }

  for(var i=p[0]-1;true;i--) {
    if(i<0) {
      break;
    }
    var t = board[i][p[1]];
    if(t !== role) break;
    count ++;
  }


  if(count >= 5) return 2;
  // \\
  reset();

  for(var i=1;true;i++) {
    var x = p[0]+i, y = p[1]+i;
    if(x>=len || y>=len) {
      break;
    }
    var t = board[x][y];
    if(t !== role) break;
      
    count ++;
  }

  for(var i=1;true;i++) {
    var x = p[0]-i, y = p[1]-i;
    if(x<0||y<0) {
      break;
    }
    var t = board[x][y];
    if(t !== role) break;
    count ++;
  }

  if(count >= 5) return 3;

  // \/
  reset();

  for(var i=1; true;i++) {
    var x = p[0]+i, y = p[1]-i;
    if(x<0||y<0||x>=len||y>=len) {
      break;
    }
    var t = board[x][y];
    if(t !== role) break;
    count ++;
  }

  for(var i=1;true;i++) {
    var x = p[0]-i, y = p[1]+i;
    if(x<0||y<0||x>=len||y>=len) {
      break;
    }
    var t = board[x][y];
    if(t !== role) break;
    count ++;
  }

  if(count >= 5) return 4;

  return 0;

}


var w = function(board) {
  var p, d=0;
  for(var i=0;i<board.length && !d;i++) {
    for(var j=0;j<board[i].length && !d;j++) {
      var t = board[i][j];
      p = [i, j]
      if(t !== R.empty) {
        d = isFive(board, [i, j], t);
        if(d) break;
      }
    }
  }

  if (!d) return false;
  if (d === 1) return [
    p,
    [p[0], p[1]+1],
    [p[0], p[1]+2],
    [p[0], p[1]+3],
    [p[0], p[1]+4],
  ]
  if (d === 2) return [
    p,
    [p[0]+1, p[1]],
    [p[0]+2, p[1]],
    [p[0]+3, p[1]],
    [p[0]+4, p[1]],
  ]
  if (d === 3) return [
    p,
    [p[0]+1, p[1]+1],
    [p[0]+2, p[1]+2],
    [p[0]+3, p[1]+3],
    [p[0]+4, p[1]+4],
  ]
  if (d === 4) return [
    p,
    [p[0]+1, p[1]-1],
    [p[0]+2, p[1]-2],
    [p[0]+3, p[1]-3],
    [p[0]+4, p[1]-4],
  ]
}

export default w
