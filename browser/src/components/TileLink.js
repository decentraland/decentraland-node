import React from 'react'
import PropTypes from 'prop-types'
import im from 'immutable'

import Tile from '../lib/Tile'


export default function TileLink({ tile }) {
  const tileInstance = new Tile(tile)
  const contentText = tileInstance.hasContent() ? 'Click to see content' : 'Empty'

  return <a href={ tileInstance.getURL() } target="_blank">({ tile.get('x') }, { tile.get('y') }): { contentText }</a>
}

TileLink.propTypes = {
  tile: PropTypes.instanceOf(im.Map).isRequired
}
