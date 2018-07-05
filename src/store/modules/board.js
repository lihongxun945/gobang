import {
  SET_BOARD,
  SET_STEPS,
  ADD_CHESSMAN,
  RESET_BOARD,
  BACKWARD,
  FORWARD,
  SET_FIVES
} from '../mutations.js'

const getBoard = function (){
  return [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ]
}

const copy = function (a) {
  return a.map((r) => r.slice()).slice()
}

const state = {
  board: getBoard(),
  steps: [
    /*
     * like this:
    {
      position: [7, 7],
      role: 1
    }*/
  ],
  stepsTail: [
  ],
  fives: []
}

const getters = {
  board: state => state.board,
  steps: state => state.steps,
  stepsTail: state => state.stepsTail,
  fives: state => state.fives,
}

const mutations = {
  [RESET_BOARD] (state) {
    state.board = getBoard()
    state.steps = []
  },
  [SET_BOARD] (state, board) {
    state.board = board
  },
  [SET_STEPS] (state, steps) {
    state.steps = steps
  },
  [SET_FIVES] (state, fives) {
    state.fives = fives
  },
  [ADD_CHESSMAN] (state, {position, role}) {
    let newBoard = copy(state.board)
    newBoard[position[0]][position[1]] = role
    state.board = newBoard
    const step = {
      position: position,
      role: role
    }
    state.steps.push(step)
    state.stepsTail = [] //
  },
  [BACKWARD] (state, steps) {
    if (state.steps.length < 2) return false
    steps = steps || 2
    let i = 0
    while (i<steps) {
      const s = state.steps.pop()
      state.stepsTail.push(s)
      const p = s.position
      state.board[p[0]][p[1]] = 0
      i++
    }
  },
  [FORWARD] (state, steps) {
    if (state.stepsTail.length < 2) return false
    steps = steps || 2
    let i = 0
    while (i<steps) {
      const s = state.stepsTail.pop()
      state.steps.push(s)
      const p = s.position
      state.board[p[0]][p[1]] = s.role
      i++
    }
  }
}

const actions = {
  [RESET_BOARD] ({commit}) {
    commit(RESET_BOARD)
  },
  [SET_BOARD] ({commit}, board) {
    commit(SET_BOARD, board)
  },
  [SET_STEPS] ({commit}, steps) {
    commit(SET_STEPS, steps)
  },
  [SET_FIVES] ({commit}, fives) {
    commit(SET_FIVES, fives)
  },
  [ADD_CHESSMAN] ({commit}, c) {
    commit(ADD_CHESSMAN, c)
  },
  [BACKWARD] ({commit}, c) {
    commit(BACKWARD, c)
  },
  [FORWARD] ({commit}, c) {
    commit(FORWARD, c)
  },
}

export default {
  namespace: true,
  state,
  getters,
  actions,
  mutations
}
