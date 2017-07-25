import Tile from './Tile'


export default class Tiles {
  constructor(tiles) {
    this.tiles = tiles
  }

  sortByContent() {
    return this.tiles.sort((tileA, tileB) => {
      if(tileA.get('content') > tileB.get('content')) return -1
      if(tileA.get('content') < tileB.get('content')) return 1

      return 0
    })
  }

  countContent() {
    return this.tiles.reduce((memo, tile) =>
      memo + Number(new Tile(tile).hasContent())
    , 0)
  }
}
