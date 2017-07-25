
export default class Tile {
  constructor(tile) {
    this.tile = tile
  }

  hasContent() {
    return this.tile.get('content').replace(/0/g, '')
  }

  getCoordinates() {
    return {
      x: this.tile.get('x'),
      y: this.tile.get('y')
    }
  }

  getURL() {
    const { x, y } = this.tile.toJS()
    return `https://decentraland.org/app/?x=${x}&y=${y}`
  }

  isEqual(tile) {
    return this.tile.get('x') === tile.get('x') && this.tile.get('y') === tile.get('y')
  }
}
