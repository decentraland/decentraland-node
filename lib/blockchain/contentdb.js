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
var WebTorrent = require('webtorrent-hybrid');
var EventEmitter = require('events').EventEmitter;
var pass = require('stream').PassThrough;
var fs = require('fs');
var createTorrent = require('create-torrent');
var parseTorrent = require('parse-torrent');

var constants = require('../protocol/constants');
var util = require('../utils/util');
var co = require('../utils/co');

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
  this.webtorrent = new WebTorrent();
  var self = this;
  this.webtorrent.on('error', (err) => {
    self.logger.error('WebTorrent:', err.message);
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
  const infoHash = yield new Promise((resolve, reject) => {
    return createTorrent(file, (err, result) => err && reject(err) || resolve(result))
  }).then(buffer => parseTorrent(buffer).infoHash)
    .catch(error => console.log(`Could not read file ${file}`, error, error.stack))

  if (infoHash) {
    self.webtorrent.seed(file,
      (torrent) => {
          self.logger.info('WebTorrent is seeding:', torrent.infoHash);
          self.logger.info('Total torrents:', self.webtorrent.torrents.length);
      }
    );
  }

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

ContentDB.prototype.fetch = function fetch(x, y, hash) {

  // if null content, save default tile without downloading torrent
  if (hash === constants.NULL_HASH) {
    return;
  }

  hash = hash.substr(0, 40);

  // check if we already have that file
  if (fs.existsSync(this._pathFor(x, y, hash))) {
    return;
  }

  var self = this;

  if (this.webtorrent.torrents.filter(t => t.infoHash == hash).length > 0) {
    return;
  }
  this.logger.info('ContentDB asked to fetch content for', x, y, 'adding torrent', hash);
  this.webtorrent.add(hash, (torrent) => {
    // new torrent loaded for download
    self.logger.info(`WebTorrent new torrent loaded for ${x}, ${y}`,
      torrent.infoHash);

    torrent.on('ready', () => {
      self.logger.info('WebTorrent ready: ' + torrent.infoHash);
    });

    torrent.on('warning', (err) => {
      self.logger.warning('WebTorrent', err);
    });

    torrent.on('error', (err) => {
      self.logger.error('WebTorrent', err);
    });

    torrent.on('download', (bytes) => {
      self.logger.info('XXX just downloaded: ' + bytes);
      self.logger.info('XXX total downloaded: ' + torrent.downloaded);
      self.logger.info('XXX download speed: ' + torrent.downloadSpeed);
      self.logger.info('XXX progress: ' + torrent.progress);
    });

    torrent.on('done', () => {
      self.logger.info('WebTorrent finished downloading', torrent.infoHash);
      var content = torrent.files[0];
      self.emit('content', x, y, content, hash);
    });

  });
};

ContentDB.prototype.putFile = co(function* putFile(x, y, base64content) {
  var self = this;

  const copyPath = this._pathFor(x,y);
  yield this._dump(base64content, copyPath);
  self.logger.info('Tile file ('+x+','+y+') copy finished, starting to seed torrent');
  return this._seed(x, y);
});

module.exports = ContentDB;
