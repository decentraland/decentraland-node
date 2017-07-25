import { all, call, put, takeLatest } from 'redux-saga/effects'

import * as types from './actions/action-types'
import api from './lib/api'


// -------------------------------------------------------------------------
// MINER

function* fetchMinerInfo(action) {
  try {
    const minerinfo = yield call(() => api.RPCCall('getminerinfo'))
    const address = yield call(() => api.RPCCall('getnewaddress'))

    // Flatten the object (removing the stats key)
    const miner = { address: address.result, running: minerinfo.running, ...minerinfo.stats }

    yield put({ type: types.MINER_INFO.SUCCEDED, miner })
  } catch (error) {
    yield put({ type: types.MINER_INFO.FAILED, message: error.message })
  }
}

function* updateMiningState(action) {
  try {
    const command = {
      false: 'stopmining',
      true: 'startmining'
    }[action.running]

    // Update the UI right away, this should be handled in loading
    const miner = { running: action.running }
    yield put({ type: types.MINER_INFO.SUCCEDED, miner })

    yield call(() => api.RPCCall(command))
    yield put({ type: types.UPDATE_MINING.SUCCEDED })

    // Update the minerstate and reflect the UI
    yield fetchMinerInfo()

  } catch (error) {
    yield put({ type: types.UPDATE_MINING.FAILED, message: error.message })
  }
}

// -------------------------------------------------------------------------
// BLOCKCHAIN

function* fetchBlockchainInfo(action) {
  try {
    const blockchain = yield call(() => api.RPCCall('getblockchaininfo'))

    yield put({ type: types.BLOCKCHAIN_INFO.SUCCEDED, blockchain })
  } catch (error) {
    yield put({ type: types.BLOCKCHAIN_INFO.FAILED, message: error.message })
  }
}

// -------------------------------------------------------------------------
// TILES

function* fetchTiles(action) {
  try {
    const tiles = yield call(() => api.getTiles())

    yield put({ type: types.TILES.SUCCEDED, tiles })
  } catch (error) {
    yield put({ type: types.TILES.FAILED, message: error.message })
  }
}

function* transferTiles(action) {
  try {
    const { coordinates, address } = action
    yield call(() => api.transferTiles(coordinates, address))
    yield fetchTiles()
  } catch (error) {
    console.error('Error transfering tiles', error)
  }
}

// -------------------------------------------------------------------------
// RPC

function* sendRpc(action) {
  try {
    const rpcResult = yield call(() => api.RPCCall(action.command))

    yield put({ type: types.SEND_RPC.SUCCEDED, rpcResult })
  } catch (error) {
    yield put({ type: types.SEND_RPC.FAILED, message: error.message })
  }
}


// -------------------------------------------------------------------------
// Watchers

function* watchMinerInfoFetch() {
  yield takeLatest(types.MINER_INFO.REQUESTED, fetchMinerInfo)
}

function* watchMiningUpdate() {
  yield takeLatest(types.UPDATE_MINING.REQUESTED, updateMiningState)
}

function* watchBlockchainInfoFetch() {
  yield takeLatest(types.BLOCKCHAIN_INFO.REQUESTED, fetchBlockchainInfo)
}

function* watchTilesFetch() {
  yield takeLatest(types.TILES.REQUESTED, fetchTiles)
}

function* watchTransferTiles() {
  yield takeLatest(types.TRANSFER_TILES_REQUESTED, transferTiles)
}

function* watchSendRpc() {
  yield takeLatest(types.SEND_RPC.REQUESTED, sendRpc)
}


export default function* rootSaga() {
  yield all([
    watchMinerInfoFetch(),
    watchMiningUpdate(),

    watchBlockchainInfoFetch(),

    watchTilesFetch(),
    watchTransferTiles(),

    watchSendRpc()
  ])
}
