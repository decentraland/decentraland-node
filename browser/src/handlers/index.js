import im from 'immutable'


// ------------------------------------------
// MINER

export const MINER_INFO_REQUESTED = createLoadingHandler('miner')
export const MINER_INFO_SUCCEDED  = createSucceededHandler('miner')
export const MINER_INFO_FAILED    = createFailedHandler('miner')

// TODO: Handle this from the UI
export const UPDATE_MINING_REQUESTED = noEffectHandler()
export const UPDATE_MINING_SUCCEDED  = noEffectHandler()
export const UPDATE_MINING_FAILED    = noEffectHandler()

// ------------------------------------------
// BLOCKCHAIN

export const BLOCKCHAIN_INFO_REQUESTED = createLoadingHandler('blockchain')
export const BLOCKCHAIN_INFO_SUCCEDED  = createSucceededHandler('blockchain')
export const BLOCKCHAIN_INFO_FAILED    = createFailedHandler('blockchain')

// ------------------------------------------
// TILES

export const TILES_REQUESTED = createLoadingHandler('tiles')
export const TILES_SUCCEDED  = createSucceededHandler('tiles')
export const TILES_FAILED    = createFailedHandler('tiles')

export const TRANSFER_TILES_REQUESTED = noEffectHandler()

// ------------------------------------------
// RPC


export const SEND_RPC_REQUESTED = createLoadingHandler('rpcResult')
export const SEND_RPC_SUCCEDED  = createSucceededHandler('rpcResult')
export const SEND_RPC_FAILED    = createFailedHandler('rpcResult')

// ------------------------------------------
// MODALS

export function OPEN_MODAL(state, action) {
  return state.set('currentModal', action.modalId)
}

export function CLOSE_MODALS(state) {
  return state.set('currentModal', null)
}

export function CLOSE_MODAL(state, action) {
  // modalId not used yet, can be used to open more than one modal at a time, which is not currently supported
  return CLOSE_MODALS(state)
}

// ------------------------------------------
// UTILS

function noEffectHandler() {
  return (state) => state
}

function createLoadingHandler(key) {
  return (state, action) => state.set(key, im.Map({ loading: true }))
}

function createSucceededHandler(key) {
  return (state, action) => state.set(key, im.fromJS(action[key]))
}

function createFailedHandler(key) {
  return (state, action) => state.set(key, im.Map({ error: action.message }))
}
