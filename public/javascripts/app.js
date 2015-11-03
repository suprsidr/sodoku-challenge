/**
 * Created by suprsidr on 10/31/2015.
 */
(function () {
  'use strict'
  Array.prototype.concatAll = function () {
    var results = [];
    this.forEach(function (subArray) {
      results.push.apply(results, subArray);
    });
    return results;
  };

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

  var solved = [
    8, 3, 5, 4, 1, 6, 9, 2, 7,
    2, 9, 6, 8, 5, 7, 4, 3, 1,
    4, 1, 7, 2, 9, 3, 6, 5, 8,
    5, 6, 9, 1, 3, 4, 7, 8, 2,
    1, 2, 3, 6, 7, 8, 5, 4, 9,
    7, 4, 8, 5, 2, 9, 1, 6, 3,
    6, 5, 2, 7, 8, 1, 3, 9, 4,
    9, 8, 1, 3, 4, 5, 2, 7, 6,
    3, 7, 4, 9, 6, 2, 8, 1, 5
  ];
  var numTries = 0;
  var snapshots = [];
  snapshots.push(board.slice());
  document.querySelector('#hurray').style.display = 'none';
  document.querySelector('#boo-hiss').style.display = 'none';
  function solveSodoku(board) {
    numTries++;
    //if (numTries >= 500) return 'sorry, too many tries';
    var rows = [];
    var cols = [];
    var quads = [];
    var quadMap = [];
    var tmpBoard = [];
    document.querySelector('h2#attempts').textContent = 'My Attempt No. ' + numTries;
    //console.log(numTries);
    tmpBoard = board.slice();

    var getDiff = function (arr) {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(function (item) {
        return arr.indexOf(item) === -1 && item !== 0;
      });
    };

    var getIntersect = function () {
      // convert arguments to array
      var args = [];
      for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      // args[0] needs to have greatest length
      args.sort(function (a, b) {
        return b.length - a.length;
      });
      // get intersection
      return args[0].filter(function (item) {
        return args.every(function (arg) {
          return arg.indexOf(item) > -1
        })
      });
    };

    // columns and quads are dependent on rows
    var getRows = function (board) {
      var idx = 0, rows = [], len = board.length;
      for (var i = 0; i < len; i += 9) {
        rows[idx] = board.slice(i, i + 9);
        idx++;
      }
      return rows;
    };

    var getCols = function (rows) {
      if (rows.length === 0) {
        rows = getRows(tmpBoard);
      }
      for (var i = 0; i < 9; i++) {
        cols[i] = [];
        for (var j = 0; j < 9; j++) {
          cols[i].push(rows[j][i]);
        }
      }
      return cols;
    };

    var getQuads = function (rows) {
      if (rows.length === 0) {
        rows = getRows(tmpBoard);
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
      quadMap.forEach(function (quad, i) {
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
      return getIntersect(
        getDiff(rows[r]),
        getDiff(cols[c]),
        getDiff(getQuadContent(r + ":" + c))
      )
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

    // used to see if we've solved
    var compareArrays = function (a, b) {
      return a.every(function (item, idx) {
        //console.log(item, b[idx]);
        return item === b[idx];
      });
    };

    // simply for display on the page
    var displayBoard = function (board, el) {
      var rows = getRows(board);
      var socket = document.querySelector(el);
      socket.innerHTML = '';
      rows.forEach(function (row) {
        var p = document.createElement('p');
        row.forEach(function (item) {
          var span = document.createElement('span');
          span.textContent = item;
          p.appendChild(span);
        });
        socket.appendChild(p);
      });
    };

    var fillBoard = function (board) {
      displayBoard(board, '#socket');
      rows = getRows(board);
      cols = getCols(rows);
      quads = getQuads(rows);

      var plays = getPlays();

      var replacements = 0;

      // Get all the easy ones first
      plays.forEach(function (play, i) {
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
        var nextEasiest = [];
        quads.forEach(function (quad, i) {
          nextEasiest.push({idx: i, val: getDiff(getQuadContent(quadMap[i][0]))});
        });
        nextEasiest.sort(function (a, b) {
          return a.val.length - b.val.length;
        }).filter(function (a) {
          return a.val.length > 0;
        });
        var nextEasiestQuad = nextEasiest[0].idx;

        var nextEasiestCells = quadMap[nextEasiestQuad].map(function (item) {
          var parts = item.split(':');
          return {idx: parseInt(parts[0]) * 9 + parseInt(parts[1]), plays: getCellPlays(parts[0], parts[1])};
        }).sort(function (a, b) {
          return a.plays.length - b.plays.length;
        }).filter(function (a) {
          return a.plays.length > 0;
        });
        //console.log(nextEasiestCells);
        if (nextEasiestCells.length > 0) {
          var next = nextEasiestCells[0].idx;
          var rndIdx = Math.floor(Math.random() * plays[next].length);
          console.log('rndIdx: ' + rndIdx);
          tmpBoard[next] = plays[next][rndIdx];
        } else {
          // wtf? no more nextEasiestCells? not sure how this happens.
          // last ditch check to see if we actually solved
          if (compareArrays(tmpBoard, solved)) {
            return;
          }
          // how do we determine where we went wrong? how far back do I rollback to?
          // total reset.
          console.log('rolling back to: ', snapshots[0]);
          return solveSodoku(snapshots[0]);
        }
      }
    };

    displayBoard(solved, '#answer');
    displayBoard(tmpBoard, '#socket');
    fillBoard(tmpBoard);

    if (compareArrays(tmpBoard, solved)) {
      displayBoard(tmpBoard, '#socket');
      document.querySelector('#hurray').style.display = 'block';
      return 'Hurray!';
    } else {
      displayBoard(tmpBoard, '#socket');
      if (numTries >= 1000) {
        document.querySelector('#boo-hiss').style.display = 'block';
        return 'Sorry, too many tries!';
      }
      return solveSodoku(tmpBoard);
    }

  }

  console.log(solveSodoku(board));
}());
