import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { board_size } from '../config';
import { STATUS } from '../status';
import { start, end, move, undo } from '../bridge';

export const startGame = createAsyncThunk('game/start', async ({ board_size, aiFirst, depth }) => {
  const data = await start(board_size, aiFirst, depth);
  return data;
});

export const movePiece = createAsyncThunk('game/move', async ({ position, depth = 4 }) => {
  const data = await move(position, depth);
  return data;
});

export const endGame = createAsyncThunk('game/end', async (sessionId) => {
  const data = await end();
  return data;
});

export const undoMove = createAsyncThunk('game/undo', async (sessionId) => {
  const data = await undo();
  return data;
});

const initBoard = Array.from({ length: board_size }).map(() => Array.from({ length: board_size }).fill(0));

const initialState = {
  board: initBoard,
  aiFirst: true,
  currentPlayer: null,
  winner: null,
  history: [],
  status: STATUS.IDLE,
  sessionId: null,
  size: 15,
  loading: false,
  depth: 4, // 搜索深度
  index: false, // 是否显示序号
  score: 0,
  path: [],
  currentDepth: 0,
};

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    tempMove: (state, action) => {
      const p = action.payload
      state.board[p[0]][p[1]] = state.currentPlayer;
      state.history.push({
        i: p[0],
        j: p[1],
        role: state.currentPlayer,
      });
    },
    setAiFirst: (state, action) => {
      state.aiFirst = action.payload;
    },
    setDepth: (state, action) => {
      state.depth = Number(action.payload);
    },
    setIndex: (state, action) => {
      state.index = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startGame.pending, (state) => {
        state.loading = true;
      })
      .addCase(startGame.fulfilled, (state, action) => {
        state.board = action.payload.board;
        state.currentPlayer = action.payload.current_player;
        state.winner = action.payload.winner;
        state.history = action.payload.history;
        state.status = STATUS.GAMING;
        state.sessionId = action.payload.session_id;
        state.size = action.payload.size;
        state.score = action.payload.score;
        state.path = action.payload.bestPath;
        state.currentDepth = action.payload.currentDepth;
        state.loading = false;
      })
      .addCase(movePiece.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(movePiece.fulfilled, (state, action) => {
        state.board = action.payload.board;
        state.currentPlayer = action.payload.current_player;
        state.winner = action.payload.winner;
        state.history = action.payload.history;
        state.score = action.payload.score;
        state.path = action.payload.bestPath;
        state.currentDepth = action.payload.currentDepth;
        state.loading = false;
        if (action.payload.winner !== 0) {
          state.status = STATUS.IDLE;
        }
      })
      .addCase(undoMove.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(undoMove.fulfilled, (state, action) => {
        state.board = action.payload.board;
        state.currentPlayer = action.payload.current_player;
        state.winner = action.payload.winner;
        state.history = action.payload.history;
        state.score = action.payload.score;
        state.path = action.payload.bestPath;
        state.currentDepth = action.payload.currentDepth;
        state.loading = false;
      })
      .addCase(endGame.fulfilled, () => {
        return initialState;
      });
  },
});
export const { tempMove, setAiFirst, setDepth, setIndex } = gameSlice.actions;
export default gameSlice.reducer;
