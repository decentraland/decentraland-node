import axios from 'axios'


const httpClient = axios.create()
const URL = process.env.REACT_APP_API_URL || 'http://localhost'
const PORT = process.env.REACT_APP_API_PORT || 5000

class API {
  getTiles() {
    return this.request('get', '/gettiles')
  }

  transferTiles(coordinates, address) {
    return this.request('post', '/transfertiles', { coordinates, address })
  }

  RPCCall(cmd) {
    return this.request('post', '/rpccall', { cmd })
  }

  request(method, path, params) {
    let options = {
      method,
      url: `${URL}:${PORT}${path}`
    }

    if (params) {
      params = JSON.stringify(params)

      if (method === 'get') {
        options.params = { params }
      } else {
        options.data = params
      }
    }

    console.log(`[API] ${method} ${path}`, options)

    return httpClient.request(options)
      .then(response => response.data)
      .catch(err => {
        let error
        console.log('RESPONSE ERROR', error)

        if (err.status === 401) {
          error = new AuthorizationError()
        } else {
          error = new Error('[API] HTTP request failed. Inspect this error for more info')
          Object.assign(error, err)
        }

        console.log(`[WARN] ${error.message}`)

        throw error
      })
  }
}


export class AuthorizationError {
  constructor() {
    this.status = 401
    this.message = 'Server rejected credentials. Logging out'
  }

  toString() {
    return this.message
  }
}


export default new API()
