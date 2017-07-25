/*!
 * tile.js - tile object for decentraland
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License)
 * Copyright (c) 2014-2016, Christopher Jeffrey (MIT License).
 * Copyright (c) 2016-2017, Manuel Araoz (MIT License).
 * https://github.com/decentraland/decentraland-node
 */

'use strict';

var assert = require('assert');
var util = require('../utils/util');
var constants = require('../protocol/constants');
var Network = require('../protocol/network');
var Output = require('./output');
var Script = require('../script/script');
var Network = require('../protocol/network');
var BufferReader = require('../utils/reader');
var StaticWriter = require('../utils/staticwriter');

/**
 * Represents an unspent output.
 * @exports Tile
 * @constructor
 * @extends Output
 * @param {NakedTile|Tile} options
 * @property {Number} version - Transaction version.
 * @property {Number} height - Transaction height (-1 if unconfirmed).
 * @property {Script} script - Output script.
 * @property {Boolean} coinbase - Whether the containing
 * transaction is a coinbase.
 * @property {Hash} hash - Transaction hash.
 * @property {Number} index - Output index.
 */

function Tile(options) {
  if (!(this instanceof Tile))
    return new Tile(options);

  this.version = 1;
  this.height = -1;
  this.content = new Buffer(34);
  this.x = 0;
  this.y = 0;
  this.script = new Script();
  this.coinbase = true;
  this.hash = constants.NULL_HASH;
  this.index = 0;

  if (options)
    this.fromOptions(options);
}

util.inherits(Tile, Output);

/**
 * Inject options into tile.
 * @private
 * @param {Object} options
 */

Tile.prototype.fromOptions = function fromOptions(options) {
  assert(options, 'Tile data is required.');
  assert(util.isNumber(options.version));
  assert(util.isNumber(options.height));
  assert(Buffer.isBuffer(options.content));
  assert(typeof options.coinbase === 'boolean');
  assert(options.hash == null || typeof options.hash === 'string');
  assert(options.index == null || util.isNumber(options.index));

  this.version = options.version;
  this.height = options.height;
  this.content = options.content;
  this.x = options.x;
  this.y = options.y;

  if (options.script)
    this.script.fromOptions(options.script);

  this.coinbase = options.coinbase;
  this.hash = options.hash;
  this.index = options.index;

  return this;
};

/**
 * Instantiate Tile from options object.
 * @private
 * @param {Object} options
 */

Tile.fromOptions = function fromOptions(options) {
  return new Tile().fromOptions(options);
};

/**
 * Calculate number of confirmations since tile was created.
 * @param {Number?} height - Current chain height. Network
 * height is used if not passed in.
 * @return {Number}
 */

Tile.prototype.getDepth = function getDepth(height) {
  assert(typeof height === 'number', 'Must pass a height.');

  if (this.height === -1)
    return 0;

  if (height < this.height)
    return 0;

  return height - this.height + 1;
};

/**
 * Serialize tile to a key
 * suitable for a hash table.
 * @returns {String}
 */

Tile.prototype.toKey = function toKey() {
  return this.hash + this.index;
};

/**
 * Inject properties from hash table key.
 * @private
 * @param {String} key
 * @returns {Tile}
 */

Tile.prototype.fromKey = function fromKey(key) {
  assert(key.length > 64);
  this.hash = key.slice(0, 64);
  this.index = +key.slice(64);
  return this;
};

/**
 * Instantiate tile from hash table key.
 * @param {String} key
 * @returns {Tile}
 */

Tile.fromKey = function fromKey(key) {
  return new Tile().fromKey(key);
};

/**
 * Convert the tile to a more user-friendly object.
 * @returns {Object}
 */

Tile.prototype.inspect = function inspect() {
  return {
    type: this.getType(),
    version: this.version,
    height: this.height,
    content: this.content.toString('hex'),
    x: this.x,
    y: this.y,
    script: this.script,
    coinbase: this.coinbase,
    hash: this.hash
      ? (typeof this.hash === 'string')
        ? util.revHex(this.hash)
        : this.hash.toString('hex')
      : null,
    index: this.index,
    address: this.getAddress()
  };
};

/**
 * Convert the tile to an object suitable
 * for JSON serialization.
 * @returns {Object}
 */

Tile.prototype.toJSON = function toJSON() {
  return this.getJSON();
};

/**
 * Convert the tile to an object suitable
 * for JSON serialization. Note that the hash
 * will be reversed to abide by bitcoind's legacy
 * of little-endian uint256s.
 * @param {Network} network
 * @param {Boolean} minimal
 * @returns {Object}
 */

Tile.prototype.getJSON = function getJSON(network, minimal) {
  var address = this.getAddress();

  network = Network.get(network);

  if (address)
    address = address.toBase58(network);

  return {
    version: this.version,
    height: this.height,
    content: this.content.toString('hex'),
    x: this.x,
    y: this.y,
    script: this.script.toJSON(),
    address: address,
    coinbase: this.coinbase,
    hash: !minimal
      ? (this.hash ? util.revHex(this.hash) : null)
      : undefined,
    index: !minimal ? this.index : undefined
  };
};

/**
 * Inject JSON properties into tile.
 * @private
 * @param {Object} json
 */

Tile.prototype.fromJSON = function fromJSON(json) {
  assert(json, 'Tile data required.');
  assert(util.isNumber(json.version));
  assert(util.isNumber(json.height));
  assert(typeof json.content === 'string');
  assert(typeof json.coinbase === 'boolean');
  assert(!json.hash || typeof json.hash === 'string');
  assert(!json.index || util.isNumber(json.index));

  this.version = json.version;
  this.height = json.height;
  this.content = new Buffer(json.content, 'hex');
  this.x = json.x;
  this.y = json.y;
  this.script.fromJSON(json.script);
  this.coinbase = json.coinbase;
  this.hash = json.hash ? util.revHex(json.hash) : null;
  this.index = json.index != null ? json.index : -1;

  return this;
};

/**
 * Instantiate an Tile from a jsonified tile object.
 * @param {Object} json - The jsonified tile object.
 * @returns {Tile}
 */

Tile.fromJSON = function fromJSON(json) {
  return new Tile().fromJSON(json);
};

/**
 * Calculate size of tile.
 * @returns {Number}
 */

Tile.prototype.getSize = function getSize() {
  return 18 + 8 + 34 + this.script.getVarSize();
};

/**
 * Write the tile to a buffer writer.
 * @param {BufferWriter} bw
 */

Tile.prototype.toWriter = function toWriter(bw) {
  var height = this.height;

  if (height === -1)
    height = 0x7fffffff;

  bw.writeU32(this.version);
  bw.writeU32(height);
  bw.write64(this.x);
  bw.write64(this.y);
  bw.writeVarBytes(this.content);
  bw.writeVarBytes(this.script.toRaw());
  bw.writeU8(this.coinbase ? 1 : 0);

  return bw;
};

/**
 * Serialize the tile.
 * @returns {Buffer|String}
 */

Tile.prototype.toRaw = function toRaw() {
  var size = this.getSize();
  return this.toWriter(new StaticWriter(size)).render();
};

/**
 * Inject properties from serialized buffer writer.
 * @private
 * @param {BufferReader} br
 */

Tile.prototype.fromReader = function fromReader(br) {
  this.version = br.readU32();
  this.height = br.readU32();
  this.x = br.read64();
  this.y = br.read64();
  this.content = br.readVarBytes();
  this.script.fromRaw(br.readVarBytes());
  this.coinbase = br.readU8() === 1;

  if (this.height === 0x7fffffff)
    this.height = -1;

  return this;
};

/**
 * Inject properties from serialized data.
 * @private
 * @param {Buffer} data
 */

Tile.prototype.fromRaw = function fromRaw(data) {
  return this.fromReader(new BufferReader(data));
};

/**
 * Instantiate a tile from a buffer reader.
 * @param {BufferReader} br
 * @returns {Tile}
 */

Tile.fromReader = function fromReader(br) {
  return new Tile().fromReader(br);
};

/**
 * Instantiate a tile from a serialized Buffer.
 * @param {Buffer} data
 * @param {String?} enc - Encoding, can be `'hex'` or null.
 * @returns {Tile}
 */

Tile.fromRaw = function fromRaw(data, enc) {
  if (typeof data === 'string')
    data = new Buffer(data, enc);
  return new Tile().fromRaw(data);
};

/**
 * Inject properties from TX.
 * @param {TX} tx
 * @param {Number} index
 */

Tile.prototype.fromTX = function fromTX(tx, index, height) {
  assert(util.isNumber(index));
  assert(index < tx.outputs.length);
  assert(typeof height === 'number');
  this.version = tx.version;
  this.height = height;
  this.content = tx.outputs[index].content;
  this.x = tx.outputs[index].x;
  this.y = tx.outputs[index].y;
  this.script = tx.outputs[index].script;
  this.coinbase = tx.isCoinbase();
  this.hash = tx.hash('hex');
  this.index = index;
  return this;
};

/**
 * Instantiate a tile from a TX
 * @param {TX} tx
 * @param {Number} index - Output index.
 * @returns {Tile}
 */

Tile.fromTX = function fromTX(tx, index, height) {
  return new Tile().fromTX(tx, index, height);
};

/**
 * Test an object to see if it is a Tile.
 * @param {Object} obj
 * @returns {Boolean}
 */

Tile.isTile = function isTile(obj) {
  return obj
    && obj.version !== undefined
    && obj.script !== undefined
    && typeof obj.getDepth === 'function';
};

/*
 * Expose
 */

module.exports = Tile;
