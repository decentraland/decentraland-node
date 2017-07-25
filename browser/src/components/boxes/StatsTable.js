import React from 'react'
import PropTypes from 'prop-types'
import im from 'immutable'
import './StatsTable.css'


const EMPTY_VALUE = '-'

export default function StatsTable({ blockchain, hashrate }) {
  return <table className="StatsTable">
    <thead>
      <tr>
        <th>Chain</th>
        <th>Mining speed</th>
        <th>Blocks</th>
        <th className="hidden-xs">Difficulty</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{ blockchain.get('chain') || EMPTY_VALUE }</td>

        <td>{ hashrate }khz</td>

        <td>{ blockchain.get('blocks') || EMPTY_VALUE }</td>

        <td className="hidden-xs">{ blockchain.get('difficulty') || EMPTY_VALUE }</td>
      </tr>
    </tbody>
  </table>
}

StatsTable.propTypes = {
  blockchain: PropTypes.instanceOf(im.Map),
  hashrate  : PropTypes.number
}

StatsTable.defaultProps = {
  hashrate: 0
}
