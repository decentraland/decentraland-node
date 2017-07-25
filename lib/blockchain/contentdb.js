/*!
 * chaindb.js - content data management for decentraland
 * Copyright (c) 2014-2015, Fedor Indutny (MIT License)
 * Copyright (c) 2014-2016, Christopher Jeffrey (MIT License).
 * Copyright (c) 2016-2017, Manuel Araoz (MIT License).
 * Copyright (c) 2016-2017, Esteban Ordano (MIT License).
 * Copyright (c) 2016-2017, Yemel Jardi (MIT License).
 * Copyright (c) 2016-2017, The Decentraland Development Team (MIT License).
 * https://github.com/decentraland/decentraland-node
 */

'use strict';

var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var pass = require('stream').PassThrough;
var fs = require('fs');

var constants = require('../protocol/constants');
var util = require('../utils/util');
var co = require('../utils/co');

const wrtc = require('electron-webrtc');
const WStar = require('libp2p-webrtc-star');
const IPFS = require('ipfs');
const bs58 = require('bs58');

/**
 * WebTorrent-based content database
 * @exports ContentDB
 */
function ContentDB(chain) {
  if (!(this instanceof ContentDB))
    return new ContentDB(chain);

  EventEmitter.call(this);

  this.chain = chain;
  this.logger = chain.logger;
  this.network = chain.network;
  this.options = chain.options;
  const wstar = new WStar({
    wrtc
  });
  var ipfsReady;
  this.ipfsReady = new Promise(resolve => ipfsReady = resolve);
  this.ipfs = new IPFS({
    repo: this.options.prefix+'ipfs',
    libp2p: {
      modules: {
        transport: [wstar],
        discovery: [wstar.discovery]
      }
    }
  });
  var self = this;

  this.ipfs.on('error',(err)=>{
    this.logger.error('IPFS Error: '+err);
  });
  this.ipfs.on('ready',()=>{
    this.logger.info('IPFS ready');
    ipfsReady();
  });

  var dirPath = this._dirPath();
  mkdirp.sync(dirPath);

  this.startSeeding();
}
util.inherits(ContentDB, EventEmitter);

ContentDB.prototype.startSeeding = function () {
  // Explore directory for latest version
  const testFolder = this._dirPath();
  fs.readdir(testFolder, (err, files) => {
    files.forEach(file => {
      if (!this._nameMatch(file)) {
        return;
      }
      const { x, y } = this._getCoorsFromFileName(file);
      this._seed(x, y);
    });
  });
};

const NAME_REGEX = new RegExp('^(-?\\d+)\\.(-?\\d+)\.lnd$');

ContentDB.prototype._nameMatch = function (file) {
  return !!NAME_REGEX.exec(file);
};

ContentDB.prototype._getCoorsFromFileName = function (file) {
  const res = NAME_REGEX.exec(file);
  return { x: parseInt(res[1], 10), y: parseInt(res[2], 10) };
};

ContentDB.prototype._dirPath = function () {
  return this.options.prefix + 'tiles' + path.sep;
};

ContentDB.prototype._pathFor = function (x, y, hash) {
  var dirPath = this._dirPath();
  var namePath = x + '.' + y;
  if (hash) {
    namePath += '.' + hash;
  }
  namePath += '.lnd';
  const fullPath = dirPath + namePath;
  return fullPath;
};

ContentDB.prototype._seed = co(function* _seed(x, y) {
  var self = this;
  const file = this._pathFor(x,y);
  const infoHash = yield new Promise((resolve,reject)=>{
    this.ipfsReady.then(()=>{
      return self.ipfs.files.add(fs.createReadStream(file), (err,result)=>{
        if(err) { reject(err); }
        var hash = result[0].hash;
        self.logger.info('IPFS seeding', hash);
        var hashBuf = bs58.decode(hash);
        var hashHex = hashBuf.toString('hex');
        resolve(hashHex);
      });
    });
  }).catch(error => self.logger.error('ContentDB could not read file', file, error, error.stack));

  return infoHash;
});

ContentDB.prototype._copy = co(function* _copy(from, to) {
  yield fs.createReadStream(from)
    .pipe(fs.createWriteStream(to));
});

ContentDB.prototype._dump = co(function* _dump(base64content, to) {
  var content = Buffer.from(base64content, 'base64');
  var stream = new pass();
  stream.end(content);
  yield stream.pipe(fs.createWriteStream(to));
});

ContentDB.prototype.save = co(function* save(x, y, hash, stream, isCurrent) {
  const currentPath = this._pathFor(x, y);
  const historicPath = this._pathFor(x, y, hash);
  var save = stream.pipe(fs.createWriteStream(historicPath));
  var self = this;
  save.on('finish', () => {
    if (isCurrent) {
      self.logger.info(`Saving new version of ${x}, ${y} at ${historicPath}`);
      this._copy(historicPath, currentPath);
      this._seed(x , y);
    }
  });
});

ContentDB.prototype.fetch = function fetch(x, y, hashHex) {
  
  // if null content, save default tile without downloading object
  if (hashHex === constants.IPFS_NULL_HASH) {
    return;
  }
  
  // Encode hash
  var hashBuf = new Buffer(hashHex, 'hex');
  var hash = bs58.encode(hashBuf);

  // check if we already have that file
  if (fs.existsSync(this._pathFor(x, y, hash))) {
    return;
  }

  var self = this;

  // TBI: Detect already acquiring
  this.logger.info('ContentDB asked to fetch content for', x, y, hash);
  this.ipfsReady.then(()=>{
    this.ipfs.files.cat(hash, (err, stream)=>{
      if (err) {
        self.logger.error('IPFS fetch error: '+err);
        throw err;
      }
      self.logger.info('IPFS fetching', x, y, hash);
      var data = Buffer.alloc(0);
      stream.on('data',(chunk)=>{
        const numBytes = chunk.length;
        self.logger.info('IPFS received '+numBytes+' bytes for', hash);
        data = Buffer.concat([data,chunk]);
      });
      stream.on('end',()=>{
        self.logger.info('IPFS finished downloading', hash);
        self.emit('content', x, y, data, hash);
      });
    });
  });
};

ContentDB.prototype.putFile = co(function* putFile(x, y, base64content) {
  var self = this;

  const copyPath = this._pathFor(x,y);
  yield this._dump(base64content, copyPath);
  self.logger.info('Tile file ('+x+','+y+') copy finished, starting to seed');
  return this._seed(x, y);
});

module.exports = ContentDB;
