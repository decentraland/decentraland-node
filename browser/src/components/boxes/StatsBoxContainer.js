import React from 'react'
import PropTypes from 'prop-types'
import im from 'immutable'

import { connect } from '../../store'
import Loading from '../Loading'
import StatsTable from './StatsTable'
import './Box.css'


class StatsBoxContainer extends React.Component {
  static getState(state) {
    return {
      blockchain: state.get('blockchain'),
      hashrate  : state.getIn([ 'miner', 'hashrate' ])
    }
  }

  static getActions(actions) {
    return {
      fetchBlockchainInfo: actions.fetchBlockchainInfo,
      fetchMinerInfo     : actions.fetchMinerInfo
    }
  }

  static propTypes = {
    blockchain: PropTypes.instanceOf(im.Map).isRequired,
    hashrate  : PropTypes.number,
    actions   : PropTypes.object
  };

  componentWillMount() {
    const { fetchBlockchainInfo, fetchMinerInfo } = this.props.actions

    Promise.all([
      fetchBlockchainInfo(),
      fetchMinerInfo()
    ])
  }

  render() {
    const { blockchain, hashrate } = this.props

    return <div className="Box node-stats">
      <h2>Stats</h2>

      { blockchain.get('loading') && hashrate != null
          ? <Loading />
          : <div>
            <StatsTable blockchain={ blockchain } hashrate={ hashrate } />
          </div> }
    </div>
  }
}


export default connect(StatsBoxContainer)

