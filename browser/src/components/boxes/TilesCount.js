import React from 'react'
import PropTypes from 'prop-types'
import im from 'immutable'

import Tiles from '../../lib/Tiles'


export default function TilesCount({ tiles }) {
  const contentCount = new Tiles(tiles).countContent()
  const emptyCount = tiles.size - contentCount

  return <span>
    You have { contentCount } tiles with content and { emptyCount } empty ones for a total of { tiles.size } tiles.
  </span>
}

TilesCount.propTypes = {
  tiles: PropTypes.oneOfType([
    PropTypes.instanceOf(im.List), // tiles list
    PropTypes.instanceOf(im.Map)   // loading/error
  ]).isRequired,
}

TilesCount.defaultProps = {
  tiles: im.List()
}
