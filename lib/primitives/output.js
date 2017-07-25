/*!
 * output.js - output object for decentraland
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License)
 * Copyright (c) 2014-2016, Christopher Jeffrey (MIT License).
 * Copyright (c) 2016-2017, Manuel Araoz (MIT License).
 * https://github.com/decentraland/decentraland-node
 */

'use strict';

var util = require('../utils/util');
var constants = require('../protocol/constants');
var Script = require('../script/script');
var StaticWriter = require('../utils/staticwriter');
var BufferReader = require('../utils/reader');
var assert = require('assert');

/**
 * Represents a transaction output.
 * @exports Output
 * @constructor
 * @param {NakedOutput} options
 * @property {Script} script
 */

function Output(options) {
  if (!(this instanceof Output))
    return new Output(options);

  this.content = new Buffer(constants.IPFS_NULL_HASH, 'hex');
  //this.content = new Buffer('12205546ad785447096c3008081d5d0b9c64da48f3efb108ee4788ddebc94cea1a51','hex');
  this.x = 0;
  this.y = 0;
  this.script = new Script();
  this.mutable = false;
  this._address = null;

  if (options)
    this.fromOptions(options);
}

/**
 * Inject properties from options object.
 * @private
 * @param {NakedOutput} options
 */

Output.prototype.fromOptions = function fromOptions(options) {
  assert(options, 'Output data is required.');

  if (options.content) {
    assert(Buffer.isBuffer(options.content));
    assert(options.content.length === 34, options.content.length);
    this.content = options.content;
  }

  if (util.isNumber(options.x)) {
    assert(util.isNumber(options.x));
    assert(util.isNumber(options.y));
    this.x = options.x;
    this.y = options.y;
  }

  if (options.script)
    this.script.fromOptions(options.script);

  if (options.address)
    this.script.fromAddress(options.address);

  return this;
};

/**
 * Instantiate output from options object.
 * @param {NakedOutput} options
 * @returns {Output}
 */

Output.fromOptions = function fromOptions(options) {
  return new Output().fromOptions(options);
};

/**
 * Get the script type as a string.
 * @returns {ScriptType} type
 */

Output.prototype.getType = function getType() {
  return constants.scriptTypesByVal[this.script.getType()].toLowerCase();
};

/**
 * Get the address.
 * @returns {Address} address
 */

Output.prototype.getAddress = function getAddress() {
  var address = this._address;

  if (!address) {
    address = this.script.getAddress();
    if (!this.mutable)
      this._address = address;
  }

  return address;
};

/**
 * Get the address hash.
 * @param {String?} enc
 * @returns {Hash} hash
 */

Output.prototype.getHash = function getHash(enc) {
  var address = this.getAddress();
  if (!address)
    return;
  return address.getHash(enc);
};

/**
 * Convert the input to a more user-friendly object.
 * @returns {Object}
 */

Output.prototype.inspect = function inspect() {
  return {
    type: this.getType(),
    content: this.content.toString('hex'),
    x: this.x,
    y: this.y,
    script: this.script,
    address: this.getAddress()
  };
};

/**
 * Convert the output to an object suitable
 * for JSON serialization.
 * @returns {Object}
 */

Output.prototype.toJSON = function toJSON() {
  return this.getJSON();
};

/**
 * Convert the output to an object suitable
 * for JSON serialization.
 * @param {Network} network
 * @returns {Object}
 */

Output.prototype.getJSON = function getJSON(network) {
  var address = this.getAddress();

  var Network = require('../protocol/network');
  network = Network.get(network);

  if (address)
    address = address.toBase58(network);

  return {
    x: this.x,
    y: this.y,
    content: this.content.toString('hex'),
    script: this.script.toJSON(),
    address: address
  };
};

/**
 * Calculate the dust threshold for this
 * output, based on serialize size and rate.
 * @param {Rate?} rate
 * @returns {Amount}
 */

Output.prototype.getDustThreshold = function getDustThreshold(rate) {
  return 0;
};

/**
 * Calculate size of serialized output.
 * @returns {Number}
 */

Output.prototype.getSize = function getSize() {
  return 8 + 8 + 34 + this.script.getVarSize();
};

/**
 * Test whether the output should be considered dust.
 * @param {Rate?} rate
 * @returns {Boolean}
 */

Output.prototype.isDust = function isDust(rate) {
  return false;
};

/**
 * Inject properties from a JSON object.
 * @private
 * @param {Object} json
 */

Output.prototype.fromJSON = function fromJSON(json) {
  assert(typeof json.content === 'string');
  this.x = json.x;
  this.y = json.y;
  this.content = new Buffer(json.content, 'hex');
  this.script.fromJSON(json.script);
  return this;
};

/**
 * Instantiate an Output from a jsonified output object.
 * @param {Object} json - The jsonified output object.
 * @returns {Output}
 */

Output.fromJSON = function fromJSON(json) {
  return new Output().fromJSON(json);
};

/**
 * Write the output to a buffer writer.
 * @param {BufferWriter} bw
 */

Output.prototype.toWriter = function toWriter(bw) {
  bw.write64(this.x);
  bw.write64(this.y);
  bw.writeBytes(this.content);
  bw.writeVarBytes(this.script.toRaw());
  return bw;
};

/**
 * Serialize the output.
 * @param {String?} enc - Encoding, can be `'hex'` or null.
 * @returns {Buffer|String}
 */

Output.prototype.toRaw = function toRaw() {
  var size = this.getSize();
  return this.toWriter(new StaticWriter(size)).render();
};

/**
 * Inject properties from buffer reader.
 * @private
 * @param {BufferReader} br
 */

Output.prototype.fromReader = function fromReader(br) {
  this.x = br.read64();
  this.y = br.read64();
  this.content = br.readBytes(34);
  this.script.fromRaw(br.readVarBytes());
  return this;
};

/**
 * Inject properties from serialized data.
 * @private
 * @param {Buffer} data
 */

Output.prototype.fromRaw = function fromRaw(data) {
  return this.fromReader(new BufferReader(data));
};

/**
 * Instantiate an output from a buffer reader.
 * @param {BufferReader} br
 * @returns {Output}
 */

Output.fromReader = function fromReader(br) {
  return new Output().fromReader(br);
};

/**
 * Instantiate an output from a serialized Buffer.
 * @param {Buffer} data
 * @param {String?} enc - Encoding, can be `'hex'` or null.
 * @returns {Output}
 */

Output.fromRaw = function fromRaw(data, enc) {
  if (typeof data === 'string')
    data = new Buffer(data, enc);
  return new Output().fromRaw(data);
};

/**
 * Test an object to see if it is an Output.
 * @param {Object} obj
 * @returns {Boolean}
 */

Output.isOutput = function isOutput(obj) {
  return obj
    && obj.x !== undefined
    && obj.y !== undefined
    && obj.content !== undefined
    && obj.script !== undefined
    && typeof obj.getAddress === 'function';
};

/*
 * Expose
 */

module.exports = Output;
