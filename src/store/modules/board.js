import { SET_BOARD, SET_STEPS, ADD_CHESSMAN } from '../mutations.js'

const state = {
  board: [
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
  ],
  steps: [
    /*
     * like this:
    {
      position: [7, 7],
      role: 1
    }*/
  ]
}

const getters = {
  board: state => state.board,
  steps: state => state.steps
}

const mutations = {
  [SET_BOARD] (state, board) {
    state.board = board
  },
  [SET_STEPS] (state, steps) {
    state.steps = steps
  },
  [ADD_CHESSMAN] (state, {position, role}) {
    let newBoard = state.board.slice(0)
    newBoard[position[0]][position[1]] = role
    state.board = newBoard
    state.steps.push({
      position: position,
      role: role
    })
  },
}

const actions = {
  [SET_BOARD] ({commit}, board) {
    commit(SET_BOARD, board)
  },
  [SET_STEPS] ({commit}, steps) {
    commit(SET_STEPS, steps)
  },
  [ADD_CHESSMAN] ({commit}, c) {
    commit(ADD_CHESSMAN, c)
  },
}

export default {
  namespace: true,
  state,
  getters,
  actions,
  mutations
}
