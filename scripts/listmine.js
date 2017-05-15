const stats = require('./stats')
const { bfs, logIt, resultJson, makeRpc, logError } = stats


/// Use dumpblockchain rpc command
const useDbc = true

function exploreTiles() {
  return bfs(tile => {
    if(useDbc){
      if(tile.content==0) console.log(`${tile.x}, ${tile.y} owned -- empty`)
      else console.log(`${tile.x}, ${tile.y} owned -- current content is ${tile.content}`)
    }else{
      makeRpc('isowntile', ['' + tile.x, '' + tile.y])
      .then(owned => {
        if (owned === 'true') {
          console.log(`\t${tile.x}, ${tile.y} owned -- current content is ${tile.content}`)
        }
      }).catch(logError)
    }
  }, useDbc, true)
}

exploreTiles().catch(logError)
