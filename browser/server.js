var HTTPBase = require('../lib/http/base')
var Client = require('../lib/http/client')
var config = require('../lib/node/config')
var co = require('../lib/utils/co')
var glob = require('glob')
var fs = require('fs')

console.log('Starting Decentraland server!')
console.log('Remember that it supports the same flags as the node (via ENV or argv)\n')

var CONFIG = config({ config: true, arg: true, env: true }).data
var PORT = CONFIG.serverport || 5000

var server = new HTTPBase({ cors: true })

if (! CONFIG.apikey) console.warn('[WARN] No apikey supplied, you can explicitly set one using `--apikey YOUR_API_KEY`')
var client = new Client({
  apiKey: CONFIG.apikey
})


// --------------------------------------------------------
// Resources

if (! CONFIG.api) {
  var serveStatic = function(fullPath, requestPath) {
    var extension = fullPath.split('.').pop()

    requestPath = requestPath || fullPath.replace(__dirname + '/build', '')

    server.get(requestPath, function(req, res, send) {
      send(200, fs.readFileSync(fullPath), extension)
    })
  }

  serveStatic(__dirname + '/build/index.html', '/')
  serveStatic(__dirname + '/build/favicon.ico')
  serveStatic(__dirname + '/build/service-worker.js')

  var mainJsPath  = glob.sync(__dirname + '/build/static/js/main.*.js')[0]
  serveStatic(mainJsPath)

  var mainCssPath = glob.sync(__dirname + '/build/static/css/main.*.css')[0]
  serveStatic(mainCssPath)
}

// --------------------------------------------------------
// API

server.post('/rpccall', co(function* (req, res, send, next) {
  var cmd = req.body.cmd

  if (! cmd) return send(400, 'Tried to do a rpc call without a cmd (command)', 'text')

  try {
    var args = cmd.split(' ')

    var method = args.shift()
    var params = args.map(function(arg) {
      try {
        return JSON.parse(arg)
      } catch (e) {
        return arg
      }
    })

    console.log('Executing RPC call', method, 'with params', params)

    var result = yield client.rpc.call(method, params)
    result = typeof result === 'object' ? result : { result: result }

    if (result && result.error) throw new Error(result.error)

    send(200, result, 'json')

  } catch(error) {
    var errorMessage = 'Error trying to execute the rpc call ' + cmd + error.message
    console.log('[ERROR]', errorMessage)
    send(400, errorMessage, 'text')
  }
}))

server.post('/transfertiles', co(function* gettiles(req, res, send, next) {
  var coordinates = req.body.coordinates
  var address = req.body.address

  if (! coordinates || ! address) throw new Error('Tried to transfer tiles without all the arguments (coordinates and address)')

  console.log('Transfering tiles to', address)

  for (var i = 0; i < coordinates.length; i++) {
    var coordinate = coordinates[i]
    console.log('Moving', coordinate)
    yield client.rpc.call('transfertile', [ coordinate.x, coordinate.y, address ])
  }

  return true
}))

server.get('/gettiles', co(function* gettiles(req, res, send, next) {
  try {
    console.log('Getting mined tiles')
    var tiles = yield client.rpc.call('dumpblockchain', [ true ]) // [ true ] here means "only controlled tiles"
    send(200, tiles, 'json')

  } catch(error) {
    var errorMessage = 'Error trying to get the tiles. ' + error.message
    console.log('[ERROR]', errorMessage)
    send(400, errorMessage, 'text')
  }
}))


// --------------------------------------------------------
// Run

server.on('error', function(err) {
  console.error(err.stack.toString())
})

process.stdout.write('Running server on port ' + PORT)
if (! CONFIG.serverport) process.stdout.write('. You can change this using --serverport PORT')
console.log('')
server.listen(PORT)
