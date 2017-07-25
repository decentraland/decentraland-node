import React from 'react'
import PropTypes from 'prop-types'
import im from 'immutable'

import { connect } from '../../store'
import { TilesModalContainer } from '../modals'
import Loading from '../Loading'
import TilesCount from './TilesCount'
import TileList from './TileList'
import './Box.css'


class TilesBoxContainer extends React.Component {
  static getState(state) {
    return {
      tiles: state.get('tiles')
    }
  }

  static getActions(actions) {
    return {
      fetchTiles: actions.fetchTiles,
      openModal: actions.openModal
    }
  }

  static propTypes = {
    tiles  : PropTypes.oneOfType([
      PropTypes.instanceOf(im.List), // tiles list
      PropTypes.instanceOf(im.Map)   // loading/error
    ]).isRequired,
    actions: PropTypes.object
  };

  componentWillMount() {
    this.props.actions.fetchTiles()
  }

  openTilesModal() {
    this.props.actions.openModal(TilesModalContainer.MODAL_ID)
  }

  render() {
    const tiles = this.props.tiles

    return <div className="Box tiles">
      <h2>Tiles</h2>

      { tiles.get('loading')
          ? <Loading />
          : <TilesBox tiles={ tiles } showTransferLink={ !! tiles.size } onTransferClick={ this.openTilesModal.bind(this) } /> }
    </div>
  }
}


function TilesBox({ tiles, showTransferLink, onTransferClick }) {
  return <div className="tile-content">
    <div>
      <TilesCount tiles={ tiles } />
      &nbsp;
      { showTransferLink && <span className="link" onClick={ onTransferClick }>Transfer</span> }
    </div>

    <TileList tiles={ tiles } />
  </div>
}

TilesBox.propTypes = {
  tiles: PropTypes.instanceOf(im.List).isRequired,
  showTransferLink: PropTypes.bool.isRequired,
  onTransferClick: PropTypes.func.isRequired
}


export default connect(TilesBoxContainer)
