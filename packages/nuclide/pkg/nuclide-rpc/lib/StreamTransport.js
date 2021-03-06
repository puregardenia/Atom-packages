'use strict';
'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StreamTransport = undefined;

var _observable;

function _load_observable() {
  return _observable = require('../../commons-node/observable');
}

var _stream;

function _load_stream() {
  return _stream = require('../../commons-node/stream');
}

let StreamTransport = exports.StreamTransport = class StreamTransport {

  constructor(output, input) {
    let messageLogger = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : (direction, message) => {
      return;
    };

    this._isClosed = false;
    this._messageLogger = messageLogger;
    this._output = output;
    this._messages = (0, (_observable || _load_observable()).splitStream)((0, (_stream || _load_stream()).observeStream)(input)).do(message => {
      this._messageLogger('receive', message);
    });
  }

  send(message) {
    this._messageLogger('send', message);

    if (!(message.indexOf('\n') === -1)) {
      throw new Error('StreamTransport.send - unexpected newline in JSON message');
    }

    this._output.write(message + '\n');
  }

  onMessage() {
    return this._messages;
  }

  close() {
    this._isClosed = true;
  }

  isClosed() {
    return this._isClosed;
  }
};