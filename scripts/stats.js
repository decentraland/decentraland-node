const fetch = require('isomorphic-fetch')
let id

var apikey = "bitcoinrpc:38Dpwnjsj2zn3QETJ6GKv8YkHomA";
apikey = new Buffer(apikey).toString('base64')

const headers = { 'Authorization': 'Basic '+apikey }

function rpc(method, params) {
  id++;

  return fetch('http://localhost:8301', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      method, params, id
    })
  })
}

function makeRequest(url) {
  return fetch(`http://localhost:8301/${url}`, {
    headers
  })
}

const getJson = e => e.json()
const getResult = e => e.result
const resultJson = e => getJson(e).then(getResult)
const logIt = e => { console.log(e); return e }
const makeRpc = (name, params) => rpc(name, params).then(resultJson)

const logError = (err) => console.log(err, err.stack)

const getHashByHeight = height => makeRpc('getblockhash', [height])
const getBlock = hash => makeRpc('getblock', [hash])
const getTransaction = hash => makeRequest(`tx/${hash}`).then(getJson)
const getCoinbase = block => getTransaction(block.tx[0])
const getTile = (x, y) => rpc('gettile', [x, y]).then(resultJson)
const getCurrentHeight = () => rpc('getinfo', []).then(resultJson).then(j => j.blocks)
const getFirstAddress = tx => tx.outputs[0].address
const dumpBlockchain = mine => rpc('dumpblockchain', [mine]).then(resultJson)


const getMinerAddress = height => getHashByHeight(height)
  .then(getBlock)
  .then(getCoinbase)
  .then(getFirstAddress)

// Users mining, (unique addresses):
async function getMiningAddresses() {
  const height = await getCurrentHeight()
  const minerAddresses = {}
  let i
  console.log('Current block height', height)
  for (i = 0; i < height; i++) {
    const address = await getMinerAddress(i)
    minerAddresses[address] = 1
    if (i % 1000 === 0) {
      console.log('There are', Object.keys(minerAddresses).length, 'miners until', i)
    }
  }
  return minerAddresses
}


const DX = [0, 1, 0, -1]
const DY = [1, 0, -1, 0]

// Users with content (tiles with no null content):
async function bfs(eval, usedbc, onlyown) {
  usedbc = usedbc || false;
  onlyown = onlyown || false;
  const queue = []
  const seen = {}
  const makeCoor = (x, y) => `${x},${y}`
  let begin = 0, end = 0, tile

  queue[end++] = [ 0, 0 ]
  seen['0,0'] = true

  if(usedbc)
  {
    function blockchain(bc){
      bc = JSON.parse(bc)
      for(tile in bc) {
        eval(bc[tile])
      }
    }


    try {
      if(onlyown) await dumpBlockchain('true').then(blockchain)
      else await dumpBlockchain('true').then(blockchain)

      return;
    } catch(err){
      console.log(err)
    }
  }
  else{
    while (begin < end) {
      const [ x, y ] = queue[begin++]

      try {
        tile = await getTile(x, y)
        if (tile === null) {
          continue
        }
        await eval({ x, y, content: tile })
      } catch (err) {
        console.log(err, err.stack)
      }

      for (delta = 0; delta < 4; delta++) {
        const dx = x + DX[delta]
        const dy = y + DY[delta]
        const coor = makeCoor(dx, dy)
        if (!seen[coor]) {
          seen[coor] = true
          queue[end++] = [ dx, dy ]
        }
      }
    }
  }
}

async function getContentTiles() {
  let content = 0
  try {
    await bfs(tile => {
      if (tile.content && tile.content
          !== '0000000000000000000000000000000000000000000000000000000000000000')
      {
        console.log(`Tile ${tile.x}, ${tile.y} has content ${tile.content}`)
        content++
      }
    })
  } catch (err) {
    console.log(err, err.stack)
  }
  console.log('Tiles with content', content)
}

module.exports = {
  getContentTiles,
  getMiningAddresses,
  bfs,
  DX, DY,
  headers,
  rpc,
  makeRequest,
  getJson,
  getResult,
  resultJson,
  logIt,
  makeRpc,

  getHashByHeight,
  getBlock,
  getTransaction,
  getCoinbase,
  getTile,
  getCurrentHeight,
  getFirstAddress,
  getMinerAddress,
  logError
}
