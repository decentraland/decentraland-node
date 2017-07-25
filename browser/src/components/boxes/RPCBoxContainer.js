import React from 'react'
import PropTypes from 'prop-types'
import im from 'immutable'

import { connect } from '../../store'
import Loading from '../Loading'
import RPCResult from './RPCResult'
import './RPCBox.css'
import './Box.css'


class RPCBoxContainer extends React.Component {
  static getState(state) {
    return {
      rpcResult: state.get('rpcResult')
    }
  }

  static getActions(actions) {
    return {
      sendRpc: actions.sendRpc
    }
  }

  static propTypes = {
    rpcResult: PropTypes.instanceOf(im.Map).isRequired,
    actions  : PropTypes.object
  };

  componentWillMount() {
    this.state = {
      command: ''
    }
  }

  onChange(event) {
    this.setState({ command: event.target.value })
  }

  onSubmit(event) {
    this.props.actions.sendRpc(this.state.command)
    this.setState({ command: '' })
    event.preventDefault()
  }

  render() {
    const rpcResult = this.props.rpcResult
    const command = this.state.command

    return <div className="Box rpc">
      <h2>RPC</h2>

      <div>
        <form method="POST" action="/rpccall" className="rpc-form" onSubmit={ this.onSubmit.bind(this) }>
          <input type="text" name="cmd" className="input input-cmd" placeholder="RPC command (e.g. startmining, stopmining, getblockchaininfo)" value={ command } onChange={ this.onChange.bind(this) } />
          <input type="submit" className="input input-send" value="SEND" />
        </form>

        { rpcResult.get('loading')
            ? <Loading />
            : <RPCResult result={ rpcResult } /> }
      </div>
    </div>
  }
}


export default connect(RPCBoxContainer)
