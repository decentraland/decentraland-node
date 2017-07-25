/*!
 * compress.js - coin compressor for decentraland
 * Copyright (c) 2014-2016, Christopher Jeffrey (MIT License).
 * Copyright (c) 2016-2017, Manuel Araoz (MIT License).
 * https://github.com/decentraland/decentraland-node
 */

'use strict';

var assert = require('assert');
var ec = require('../crypto/ec');
var encoding = require('../utils/encoding');

/*
 * Constants
 */

var COMPRESS_TYPES = 10; // Space for 4 extra.

/**
 * Compress a script, write directly to the buffer.
 * @param {Script} script
 * @param {BufferWriter} bw
 */

function compressScript(script, bw) {
  script.toWriter(bw)
  return bw;
}

/**
 * Decompress a script from buffer reader.
 * @param {Script} script
 * @param {BufferReader} br
 */

function decompressScript(script, br) {
  script.fromReader(br)
  return script;
}

/**
 * Calculate script size.
 * @returns {Number}
 */

function sizeScript(script) {
   var size = 0;
  size += encoding.sizeVarint(script.raw.length + COMPRESS_TYPES);
  size += script.raw.length;

  return size;
}

/**
 * Compress an output.
 * @param {Output} output
 * @param {BufferWriter} bw
 */

function compressOutput(output, bw) {
  // TODO: use actual compression
  return output.toWriter(bw);
}

/**
 * Decompress a script from buffer reader.
 * @param {Output} output
 * @param {BufferReader} br
 */

function decompressOutput(output, br) {
  // use actual decompression
  output.fromReader(br);
  return output;
}

/**
 * Calculate output size.
 * @returns {Number}
 */

function sizeOutput(output) {
  return output.getSize();
}

/**
 * Compress an output.
 * @param {Coin} coin
 * @param {BufferWriter} bw
 */

function compressCoin(coin, bw) {
  bw.write64(coin.x);
  bw.write64(coin.y);
  bw.writeBytes(coin.content);
  compressScript(coin.script, bw);
  return bw;
}

/**
 * Decompress a script from buffer reader.
 * @param {Coin} coin
 * @param {BufferReader} br
 */

function decompressCoin(coin, br) {
  try {
    coin.value = 0;
    coin.x = br.read64();
    coin.y = br.read64();
    coin.content = br.readBytes(34);
    coin.script.fromReader(br)
    return coin;
  } catch (e) {
    console.log(e, e.stack)
  }
}

/**
 * Skip past a compressed output.
 * @param {BufferWriter} bw
 * @returns {Number}
 */

function skipOutput(br) {
  var start = br.offset;

  // Skip past the x, y, and content.
  br.seek(8 + 8 + 34);

  // Skip past the compressed scripts.
  switch (br.readU8()) {
    case 0:
    case 1:
      br.seek(20);
      break;
    case 2:
    case 3:
    case 4:
    case 5:
      br.seek(32);
      break;
    default:
      br.offset -= 1;
      br.seek(br.readVarint() - COMPRESS_TYPES);
      break;
  }

  return br.offset - start;
}

/**
 * Compress value using an exponent. Takes advantage of
 * the fact that many bitcoin values are divisible by 10.
 * @see https://github.com/btcsuite/btcd/blob/master/blockchain/compress.go
 * @param {Amount} value
 * @returns {Number}
 */

function compressValue(value) {
  var exp, last;

  if (value === 0)
    return 0;

  exp = 0;
  while (value % 10 === 0 && exp < 9) {
    value /= 10;
    exp++;
  }

  if (exp < 9) {
    last = value % 10;
    value = (value - last) / 10;
    return 1 + 10 * (9 * value + last - 1) + exp;
  }

  return 10 + 10 * (value - 1);
}

/**
 * Decompress value.
 * @param {Number} value - Compressed value.
 * @returns {Amount} value
 */

function decompressValue(value) {
  var exp, n, last;

  if (value === 0)
    return 0;

  value--;

  exp = value % 10;
  value = (value - exp) / 10;

  if (exp < 9) {
    last = value % 9;
    value = (value - last) / 9;
    n = value * 10 + last + 1;
  } else {
    n = value + 1;
  }

  while (exp > 0) {
    n *= 10;
    exp--;
  }

  return n;
}

/**
 * Verify a public key (no hybrid keys allowed).
 * @param {Buffer} key
 * @returns {Boolean}
 */

function publicKeyVerify(key) {
  if (key.length === 0)
    return false;

  switch (key[0]) {
    case 0x02:
    case 0x03:
      return key.length === 33;
    case 0x04:
      if (key.length !== 65)
        return false;

      return ec.publicKeyVerify(key);
    default:
      return false;
  }
}

/**
 * Compress a public key to coins compression format.
 * @param {Buffer} key
 * @returns {Buffer}
 */

function compressKey(key) {
  var out;

  switch (key[0]) {
    case 0x02:
    case 0x03:
      // Key is already compressed.
      out = key;
      break;
    case 0x04:
      // Compress the key normally.
      out = ec.publicKeyConvert(key, true);
      // Store the oddness.
      // Pseudo-hybrid format.
      out[0] = 0x04 | (key[64] & 0x01);
      break;
    default:
      throw new Error('Bad point format.');
  }

  assert(out.length === 33);

  return out;
}

/**
 * Decompress a public key from the coins compression format.
 * @param {Buffer} key
 * @returns {Buffer}
 */

function decompressKey(key) {
  var format = key[0];
  var out;

  assert(key.length === 33);

  switch (format) {
    case 0x02:
    case 0x03:
      return key;
    case 0x04:
      key[0] = 0x02;
      break;
    case 0x05:
      key[0] = 0x03;
      break;
    default:
      throw new Error('Bad point format.');
  }

  // Decompress the key.
  out = ec.publicKeyConvert(key, false);

  // Reset the first byte so as not to
  // mutate the original buffer.
  key[0] = format;

  return out;
}

/*
 * Expose
 */

exports.compress = {
  output: compressOutput,
  coin: compressCoin,
  size: sizeOutput,
  script: compressScript,
  value: compressValue,
  key: compressKey
};

exports.decompress = {
  output: decompressOutput,
  coin: decompressCoin,
  skip: skipOutput,
  script: decompressScript,
  value: decompressValue,
  key: decompressKey
};
