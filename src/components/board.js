import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { movePiece, tempMove } from '../store/gameSlice';
import './board.css';
import { board_size } from '../config';
import { STATUS } from '../status';

const Board = () => {
  const dispatch = useDispatch();
  const { board, history, status, loading, winner, depth, index, openingBook } = useSelector((state) => state.game);

  const handleClick = (i, j) => {
    if (loading || status !== STATUS.GAMING || board[i][j] !== 0) return;
    dispatch(tempMove([i, j]));
    dispatch(movePiece({ position: [i, j], depth, openingBook }));
  };

  const moveNumbers = new Map(history.map((move, moveIndex) => [`${move.i}-${move.j}`, moveIndex + 1]));
  const lastMove = history[history.length - 1];

  return (
    <div className="board-wrap">
      <div className="board" role="grid" aria-label="十五路五子棋棋盘">
        {board.map((row, i) => (
          <div key={i} className="board-row" role="row">
            {row.map((cell, j) => {
              const edges = [i === 0 && 'top', i === board_size - 1 && 'bottom', j === 0 && 'left', j === board_size - 1 && 'right'].filter(Boolean).join(' ');
              const isLast = lastMove?.i === i && lastMove?.j === j;
              const number = index ? moveNumbers.get(`${i}-${j}`) : null;
              return (
                <button
                  key={j}
                  type="button"
                  role="gridcell"
                  className={`cell ${edges}`}
                  onClick={() => handleClick(i, j)}
                  disabled={cell !== 0 || loading || status !== STATUS.GAMING}
                  aria-label={`${i + 1} 行 ${j + 1} 列${cell === 1 ? '，黑棋' : cell === -1 ? '，白棋' : ''}`}
                >
                  {cell !== 0 && <span className={`piece ${cell === 1 ? 'black' : 'white'}`}>{number}</span>}
                  {isLast && <span className="last" aria-label="最后一步" />}
                </button>
              );
            })}
          </div>
        ))}
        {loading && <div className="loading"><span className="thinking-dot" /><span>AI 正在思考</span></div>}
        {winner !== 0 && winner != null && <div className="winner-banner">{winner === 1 ? '黑棋胜出' : '白棋胜出'}</div>}
      </div>
    </div>
  );
};

export default Board;
