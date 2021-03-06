/**
 * Created by suprsidr on 10/31/2015.
 */
(function () {
  'use strict';
  Array.prototype.concatAll = function() {
    var results = [];
    this.forEach((subArray) => {
      results.push.apply(results, subArray);
    });
    return results;
  };
  Array.prototype.diff = function() {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((item) =>
      this.indexOf(item) === -1);
  };
  Array.prototype.intersect = function() {
    // convert arguments to array
    var args = [this];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    // args[0] needs to have greatest length
    args.sort((a, b) =>
      b.length - a.length
    );
    // get intersection
    return args[0].filter((item) =>
      args.every((arg) =>
        arg.indexOf(item) > -1
      )
    );
  };
  Array.prototype.toRows = function() {
    var idx = 0, rows = [], len = this.length;
    for (var i = 0; i < len; i += 9) {
      rows[idx] = this.slice(i, i + 9);
      idx++;
    }
    return rows;
  };
  Array.prototype.toColumns = function() {
    var cols = [];
    for (var i = 0; i < 9; i++) {
      cols[i] = [];
      for (var j = 0; j < 9; j++) {
        cols[i].push(this[j][i]);
      }
    }
    return cols;
  };

  var str = '900000070005020800060003004000050020080009100007000006000600000001070050040008003';

  var board = [
    8, 0, 0, 4, 0, 6, 0, 0, 7,
    0, 0, 0, 0, 0, 0, 4, 0, 0,
    0, 1, 0, 0, 0, 0, 6, 5, 0,
    5, 0, 9, 0, 3, 0, 7, 8, 0,
    0, 0, 0, 0, 7, 0, 0, 0, 0,
    0, 4, 8, 0, 2, 0, 1, 0, 3,
    0, 5, 2, 0, 0, 0, 0, 9, 0,
    0, 0, 1, 0, 0, 0, 0, 0, 0,
    3, 0, 0, 9, 0, 2, 0, 0, 5
  ];

  var board2 = [
    0, 0, 7, 0, 0, 0, 9, 0, 0,
    0, 0, 0, 8, 0, 4, 0, 0, 0,
    6, 0, 0, 7, 1, 3, 0, 0, 2,
    0, 1, 3, 6, 0, 5, 2, 9, 0,
    0, 0, 6, 0, 0, 0, 3, 0, 0,
    0, 4, 8, 2, 0, 7, 6, 5, 0,
    8, 0, 0, 4, 2, 1, 0, 0, 3,
    0, 0, 0, 9, 0, 8, 0, 0, 0,
    0, 0, 1, 0, 0, 0, 8, 0, 0
  ];

  /*var solved = [
    8, 3, 5, 4, 1, 6, 9, 2, 7,
    2, 9, 6, 8, 5, 7, 4, 3, 1,
    4, 1, 7, 2, 9, 3, 6, 5, 8,
    5, 6, 9, 1, 3, 4, 7, 8, 2,
    1, 2, 3, 6, 7, 8, 5, 4, 9,
    7, 4, 8, 5, 2, 9, 1, 6, 3,
    6, 5, 2, 7, 8, 1, 3, 9, 4,
    9, 8, 1, 3, 4, 5, 2, 7, 6,
    3, 7, 4, 9, 6, 2, 8, 1, 5
  ];*/

  // simply for display on the page
  function displayBoard(board, el) {
    var rows = board.toRows();
    var socket = document.querySelector(el);
    socket.innerHTML = '';
    rows.forEach(function (row, r) {
      var p = document.createElement('p');
      row.forEach(function (item, c) {
        var span = document.createElement('span');
        span.classList.add('r'+r+'c'+c); // can we update individual cells and add animation?
        span.textContent = item;
        p.appendChild(span);
      });
      socket.appendChild(p);
    });
  };

  function solveSodoku(board) {
    var rows = [];
    var cols = [];
    var quads = [];
    var quadMap = [];
    var tmpBoard = board.slice();
    var numTries = 0;
    var rollbackCount = 0;
    var snapshots = [board.slice()];

    var getQuads = (rows) => {
      if (rows.length === 0) {
        rows = tmpBoard.toRows();
      }
      var idx = 0;
      for (var outer = 0; outer < 9; outer += 3) {
        for (var inner = 0; inner < 9; inner += 3) {
          quads[idx] = [];
          quadMap[idx] = [];
          for (var r = outer; r < outer + 3; r++) {
            quads[idx].push(rows[r].slice(inner, inner + 3));
            // ugly attempt to map which row item is in which quad
            for (var j = 0; j < 3; j++) {
              quadMap[idx].push(r + ':' + parseInt(inner + j));
            }
          }
          quads[idx] = quads[idx].concatAll();
          idx++;
        }
      }
      return quads;
    };

    var getQuadContent = function (idxs) {
      var result = [];
      if (quads.length === 0) {
        quads = getQuads();
      }
      quadMap.forEach((quad, i) => {
        if (quad.indexOf(idxs) > -1) {
          result = quads[i];
        }
      });
      return result;
    };

    var getCellPlays = function (r, c) {
      if (rows[r][c] !== 0) {
        return [];
      }
      return rows[r].diff().intersect(
        cols[c].diff(),
        getQuadContent(r + ":" + c).diff()
      );
    };

    var getPlays = function () {
      var plays = [];
      for (var i = 0; i < 9; i++) {
        for (var j = 0; j < 9; j++) {
          plays.push(getCellPlays(i, j));
        }
      }
      return plays;
    };

    // check to see if we've solved without answer
    var checkSolved = function(board) {
      var rows = board.toRows();
      var cols = rows.toColumns();
      var quads = getQuads(rows);

      return [1,2,3,4,5,6,7,8,9].every((x) => {
        return rows.every((r) => r.indexOf(x) > -1) &&
          cols.every((c) => c.indexOf(x) > -1) &&
          quads.every((q) => q.indexOf(x) > -1);
      });
    };

    var fillBoard = function (board) {
      numTries++;
      displayBoard(board, '#socket');
      document.querySelector('h2#attempts').textContent = 'No. of Passes to Solve: ' + numTries;
      tmpBoard = board.slice();
      rows = tmpBoard.toRows();
      cols = rows.toColumns();
      quads = getQuads(rows);

      var plays = getPlays();

      var replacements = 0;

      // Get all the easy ones first
      plays.forEach((play, i) => {
        if (play.length === 1 && tmpBoard[i] === 0) {
          console.log('replacing: ' + tmpBoard[i] + ' with: ' + play[0]);
          replacements++;
          tmpBoard[i] = play[0];
        }
      });

      // if we are out of easy, take a snapshot and try one of the next easiest.
      if (replacements === 0) {
        snapshots.push(tmpBoard.slice());
        console.log('making snapshot', tmpBoard);
        // get our next easiest
        // calculate the quad with the most filled in, and start there
        var nextEasiest = [];
        quads.forEach((quad, i) => nextEasiest.push({idx: i, val: quad.diff()}));
        nextEasiest = nextEasiest
          .sort((a, b) => a.val.length - b.val.length)
          .filter((a) => a.val.length > 0);
        console.log('nextEasiestQuad: ' + nextEasiest[0].idx, nextEasiest[0].val);
        var nextEasiestQuad = nextEasiest[0].idx;
        var nextEasiestCells = quadMap[nextEasiestQuad].map((item) => {
          var parts = item.split(':');
          return {
            idx: parseInt(parts[0]) * 9 + parseInt(parts[1]),
            plays: getCellPlays(parts[0], parts[1])
          };
        })
          .sort((a, b) => a.plays.length - b.plays.length)
          .filter((a) => a.plays.length > 0);

        if (nextEasiestCells.length > 0) {
          var next = nextEasiestCells[0].idx;
          console.log('nextEasiestCell: ' + next, plays[next]);
          var rndIdx = Math.floor(Math.random() * plays[next].length);
          console.log('using rndIdx: ' + rndIdx + ' replacing: ' + tmpBoard[next] + ' with: ' + plays[next][rndIdx]);
          tmpBoard[next] = plays[next][rndIdx];
          //if(numTries > 2) return;
        } else {
          if(checkSolved(tmpBoard)) {
            return;
          }
          // how do we determine where we went wrong? how far back do I rollback to?
          if(rollbackCount > 30) {
            // full reset
            console.log('full reset: ', snapshots[0]);
            rollbackCount = 0;
            fillBoard(snapshots[0]);
          } else {
            // we'll rollback to previous
            console.log('rolling back to: ', snapshots[snapshots.length - 2]);
            rollbackCount++;
            fillBoard(snapshots[snapshots.length - 2]);
          }
        }
      }
      if(checkSolved(tmpBoard)) {
        displayBoard(tmpBoard, '#socket');
        document.querySelector('#hurray').style.display = 'block';
        return 'Hurray!';
      } else {
        document.querySelector('#hurray').style.display = 'none';
        document.querySelector('#boo-hiss').style.display = 'none';
        displayBoard(tmpBoard, '#socket');
        if (numTries >= 2000) {
          displayBoard(tmpBoard, '#socket');
          document.querySelector('#boo-hiss').style.display = 'block';
          return 'Sorry, too many passes!';
        }
        return fillBoard(tmpBoard);
      }
    };

    // display our boards
    displayBoard(tmpBoard, '#original');
    displayBoard(tmpBoard, '#socket');
    setTimeout(() => fillBoard(tmpBoard), 0);

  } // end solveSodoku

  var input = document.querySelector('input');
  var button = document.querySelector('button');
  button.addEventListener('click', function(e) {
    e.preventDefault();
    var arr = Array.from(input.value, (i) => parseInt(i));
    console.log(arr, arr.length);
    if(arr.length === 81 && arr.every((i) => [0,1,2,3,4,5,6,7,8,9].indexOf(i) > -1)) {
      displayBoard(arr, '#original');
      setTimeout(() => console.log(solveSodoku(arr)), 0);
    } else {
      alert('Sorry your array does not qualify.\n It\'s either not 81 chars long, or contains illegal characters.');
    }

  }, false);


  console.log(solveSodoku(board2));
}());
