import im from 'immutable'

import { createStore, applyMiddleware, bindActionCreators } from 'redux'
import * as reactRedux from 'react-redux'
import reduxThunk from 'redux-thunk'
import createSagaMiddleware from 'redux-saga'

import * as handlers from './handlers'
import * as actions from './actions'
import rootSaga from './sagas'


// { loading, error } || { actualData }
const INITIAL_STATE = im.fromJS({
  blockchain: {},

  miner: {
    address: '',
    hashrate: 0,
    running: false
  },

  tiles: [],

  rpcResult: {},

  currentModal: null
})


function invokeHandler(state, action) {
  console.log('[STORE]', action.type, action)

  let handler = handlers[action.type]

  if (! state) return INITIAL_STATE
  if (! handler) throw new Error(`Unknown store action ${action.type}`)

  return handler(state, action)
}


export function dispatch(action) {
  if (typeof action === 'string') {
    store.dispatch({ type: action })

  } else {
    store.dispatch(action)
  }
}


export function getState() {
  return store.getState()
}


export function connect(Component) {
  function mapStateToProps(state, ownProps) {
    const selectors = Component.getState(state, ownProps)

    return selectors
  }

  function mapDispatchToProps(dispatch) {
    if (! Component.getActions) return {}

    const actionCreators = Component.getActions(actions, dispatch)

    return {
      actions: bindActionCreators(actionCreators, dispatch)
    }
  }

  return reactRedux.connect(mapStateToProps, mapDispatchToProps)(Component)
}


const sagaMiddleware = createSagaMiddleware()

export const store = createStore(
  invokeHandler,
  applyMiddleware(reduxThunk, sagaMiddleware)
)

sagaMiddleware.run(rootSaga)
