'use strict';

var BN = require('bn.js');
var util = require('../utils/util');
var constants = require('../protocol/constants');
var TX = require('../primitives/tx');
var Block = require('../primitives/block');
var Script = require('../script/script');
var Opcode = require('../script/opcode');
var opcodes = constants.opcodes;
var main, testnet, regtest;

function createGenesisBlock(options) {
  var networks = require('../protocol/networks');
  var flags = options.flags;
  var script = options.script;
  var content = options.content;
  var tx, block;

  if (!flags) {
    flags = new Buffer(
      'The Times 03/Jan/2009 Chancellor on brink of second bailout for banks',
      'ascii');
  }

  if (!content) {
    content = new Buffer(constants.IPFS_NULL_HASH, 'hex');
  }

  if (!script) {
    script = Script.fromArray([
      new Buffer('04678afdb0fe5548271967f1a67130b7105cd6a828e039'
        + '09a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c3'
        + '84df7ba0b8d578a4c702b6bf11d5f', 'hex'),
      opcodes.OP_CHECKSIG
    ]);
  }

  tx = new TX({
    version: 1,
    flag: 1,
    inputs: [{
      prevout: {
        hash: constants.NULL_HASH,
        index: 0xffffffff
      },
      script: [
        Opcode.fromNumber(new BN(486604799)),
        Opcode.fromPush(new Buffer([4])),
        Opcode.fromData(flags)
      ],
      sequence: 0xffffffff
    }],
    outputs: [{
      content,
      x: 0,
      y: 0,
      script: script
    }],
    locktime: 0
  });

  block = new Block({
    version: options.network.genesis.version,
    prevBlock: constants.NULL_HASH,
    merkleRoot: tx.hash('hex'),
    ts: options.network.genesis.ts,
    bits: options.network.genesis.bits,
    nonce: options.network.genesis.nonce,
    height: 0,
  });

  block.addTX(tx);

  return block;
}

module.exports = createGenesisBlock;
