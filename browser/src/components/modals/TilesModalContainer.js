import React from 'react'
import PropTypes from 'prop-types'
import im from 'immutable'
import Modal from 'react-modal'

import { connect } from '../../store'
import Tile from '../../lib/Tile'
import Loading from '../Loading'
import TileLink from '../TileLink'
import './Modal.css'
import './TilesModal.css'


class TilesModalContainer extends React.Component {
  static MODAL_ID = 'tilesModal';

  static getState(state) {
    return {
      currentModal: state.get('currentModal'),
      tiles: state.get('tiles')
    }
  }

  static getActions(actions) {
    return {
      transferTiles: actions.transferTiles,
      closeModal: actions.closeModal
    }
  }

  static propTypes = {
    tiles: PropTypes.oneOfType([
      PropTypes.instanceOf(im.List), // tiles list
      PropTypes.instanceOf(im.Map)   // loading/error
    ]).isRequired,
    currentModal: PropTypes.string,
    actions     : PropTypes.object
  };

  componentWillMount() {
    this.state = {
      address: '',
      selected: []
    }
  }

  isOpen() {
    return this.props.currentModal === TilesModalContainer.MODAL_ID
  }

  onSubmit(event) {
    const { address, selected } = this.state

    if (address && selected.length) {
      const coordinates = selected.map(tile => new Tile(tile).getCoordinates())

      this.props.actions.transferTiles(coordinates, address)
      this.setState({ address: '', selected: [] })

      // TODO: This is utterly wrong it doesn't reflect whats happening on the UI
      setTimeout(() => this.close())
    }

    event.preventDefault()
  }

  onChange(tile, checked) {
    let selected = this.state.selected

    selected = checked
      ? selected.concat([ tile ])
      : selected.filter(selectedTile => ! new Tile(selectedTile).isEqual(tile))

    this.setState({ selected })
  }

  updateAddress(event) {
    this.setState({ address: event.target.value })
  }

  isSelected(tile) {
    return !! this.state.selected.find(selectedTile => new Tile(selectedTile).isEqual(tile))
  }

  close() {
    this.props.actions.closeModal(TilesModal.MODAL_ID)
  }

  hasSelections() {
    return !! this.state.selected.length
  }

  render() {
    // Instead of fetching the tiles here, we relay on the store to be properly loaded
    // This can be easily changed later to be more resillient
    const tiles = this.props.tiles
    const { address, selected } = this.state
    const selectedCountText = this.hasSelections() ? `(${selected.length})` : ''


    return <Modal isOpen={ this.isOpen() } onRequestClose={ this.close.bind(this) } contentLabel="Tiles Modal">
      <span className="link close" onClick={ this.close.bind(this) }>x</span>
      { tiles.get('loading')
          ? <Loading />
          : <TilesModal
              title           = { `Transfer tiles ${selectedCountText}`}
              tiles           = { tiles }
              address         = { address }
              onSubmit        = { this.onSubmit.bind(this) }
              isSelected      = { this.isSelected.bind(this) }
              onTileChange    = { this.onChange.bind(this) }
              onAddressChange = { this.updateAddress.bind(this) }
            /> }

    </Modal>
  }
}


function TilesModal({ title, tiles, address, onSubmit, isSelected, onTileChange, onAddressChange }) {
  return <div className="TilesModal">
    <h2>{ title }</h2>

    <form method="POST" action="/transfertiles" onSubmit={ onSubmit }>
      <ul className="scrolleable">
        { tiles.map((tile, index) =>
            <TileItem key={ index } tile={ tile } checked={ isSelected(tile) } onChange={ onTileChange } />
          ).toArray() }
      </ul>

      <AddressInput address={ address } onChange={ onAddressChange }/>
      <input type="submit" className="input input-send" value="SEND" />
    </form>
  </div>
}

TilesModal.propTypes = {
  title          : PropTypes.string.isRequired,
  tiles          : PropTypes.instanceOf(im.List).isRequired,
  address        : PropTypes.string.isRequired,
  onSubmit       : PropTypes.func.isRequired,
  isSelected     : PropTypes.func.isRequired,
  onTileChange   : PropTypes.func.isRequired,
  onAddressChange: PropTypes.func.isRequired
}


function TileItem({ tile, checked, onChange }) {
  return <li>
    <input type="checkbox" name="coordinate" checked={ checked } onChange={ event => onChange(tile, event.target.checked) } />
    <TileLink tile={ tile } />
  </li>
}

TileItem.propTypes = {
  tile: PropTypes.instanceOf(im.Map).isRequired,
  checked: PropTypes.bool,
  onChange: PropTypes.func.isRequired
}

TileItem.defaultProps = {
  checked: false
}


function AddressInput({ address, onChange }) {
  return <input
    required
    type        = "text"
    name        = "address"
    className   = "input input-cmd"
    placeholder = "Destination address"
    value       = { address }
    onChange    = { onChange }
  />
}

AddressInput.propTypes = {
  address : PropTypes.string,
  onChange: PropTypes.func.isRequired
}


export default connect(TilesModalContainer)
