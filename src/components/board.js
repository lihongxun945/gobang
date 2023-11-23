
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { movePiece, tempMove } from '../store/gameSlice';
import './board.css';
import bg from '../assets/bg.jpg';
import { board_size } from '../config';
import { STATUS } from '../status';

/*
帮我用React实现一个Board组件，实现的功能是：
显示五子棋棋盘，当用户点击棋盘的时候，可以把点击位置换算成对应的棋子坐标。内部状态包括棋盘上所有棋子的坐标，历史记录，以及下一步轮到谁下。
不要用图片，直接用CSS画棋盘和棋子。
*/

const Board = () => {
  const dispatch = useDispatch();
  const { board, currentPlayer, history, status, size, loading, winner, depth, index } = useSelector((state) => state.game);

  const handleClick = (i, j) => {
    if (loading || status !== STATUS.GAMING) return;
    if (board[i][j] === 0) {
      dispatch(tempMove([i, j]))
      dispatch(movePiece({ position: [i, j], depth }));
    }
  };

  useEffect(() => {
    if (winner === 1 || winner === -1) {
      window.alert(winner === 1 ? '黑棋获胜' : '白棋获胜')
    }
  }, [winner]);

  const cellStyle = {
    width: `${375 / board_size}px`,
    height: `${375 / board_size}px`,
  };

  return (
    <div className="board" style={{ backgroundImage: `url(${bg})` }}>
      {board.map((row, i) => (
        <div key={i} className="board-row">
          {row.map((cell, j) => {
            let cellClassName = 'cell';
            if (i === 0) {
              cellClassName += ' top';
            }
            if (i === board_size - 1) {
              cellClassName += ' bottom';
            }
            if (j === 0) {
              cellClassName += ' left';
            }
            if (j === board_size - 1) {
              cellClassName += ' right';
            }
            let pieceClassname = 'piece';
            if (cell === 1) {
              pieceClassname += ' black';
            } else if (cell === -1) {
              pieceClassname += ' white';
            }
            let isLastCell = false;
            const lastMove = history[history.length - 1];
            if (lastMove && (lastMove.i === i && lastMove.j === j)) {
              isLastCell = true;
            }
            let number = 0;
            if (index) {
              for(let x = 0; x < history.length; x++) {
                if (history[x].i === i && history[x].j === j) {
                  number = x + 1;
                  break;
                }
              }
            }
            return (
              <div key={j} className={cellClassName} style={cellStyle} onClick={() => handleClick(i, j)}>
                {cell == 0 ? '' : <div className={pieceClassname}>{ number === 0 ? '' : number}</div>}
                {isLastCell && <div className="last" />}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  );
};

export default Board;
