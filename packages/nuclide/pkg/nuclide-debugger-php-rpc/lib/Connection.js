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
exports.Connection = exports.BREAKPOINT = exports.ASYNC_BREAK = undefined;

var _DbgpSocket;

function _load_DbgpSocket() {
  return _DbgpSocket = require('./DbgpSocket');
}

var _DataCache;

function _load_DataCache() {
  return _DataCache = require('./DataCache');
}

var _eventKit;

function _load_eventKit() {
  return _eventKit = require('event-kit');
}

let connectionCount = 1;

const ASYNC_BREAK = exports.ASYNC_BREAK = 'async_break';
const BREAKPOINT = exports.BREAKPOINT = 'breakpoint';

let Connection = exports.Connection = class Connection {

  constructor(socket, onStatusCallback, onNotificationCallback, isDummyConnection) {
    var _this = this;

    const dbgpSocket = new (_DbgpSocket || _load_DbgpSocket()).DbgpSocket(socket);
    this._socket = dbgpSocket;
    this._dataCache = new (_DataCache || _load_DataCache()).DataCache(dbgpSocket);
    this._id = connectionCount++;
    this._status = (_DbgpSocket || _load_DbgpSocket()).CONNECTION_STATUS.STARTING;
    this._isDummyConnection = isDummyConnection;
    this._isDummyViewable = false;
    this._disposables = new (_eventKit || _load_eventKit()).CompositeDisposable();
    if (onStatusCallback != null) {
      this._disposables.add(this.onStatus(function (status) {
        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        return onStatusCallback(_this, status, ...args);
      }));
    }
    if (onNotificationCallback != null) {
      this._disposables.add(this.onNotification((notifyName, notify) => onNotificationCallback(this, notifyName, notify)));
    }
    this._stopReason = null;
  }

  isDummyConnection() {
    return this._isDummyConnection;
  }

  getId() {
    return this._id;
  }

  onStatus(callback) {
    return this._socket.onStatus(this._handleStatus.bind(this, callback));
  }

  _handleStatus(callback, newStatus) {
    const prevStatus = this._status;
    switch (newStatus) {
      case (_DbgpSocket || _load_DbgpSocket()).CONNECTION_STATUS.RUNNING:
        this._stopReason = null;
        break;
      case (_DbgpSocket || _load_DbgpSocket()).CONNECTION_STATUS.BREAK:
        if (prevStatus === (_DbgpSocket || _load_DbgpSocket()).CONNECTION_STATUS.BREAK_MESSAGE_RECEIVED) {
          this._stopReason = ASYNC_BREAK;
        } else if (prevStatus !== (_DbgpSocket || _load_DbgpSocket()).CONNECTION_STATUS.BREAK) {
          // TODO(dbonafilia): investigate why we sometimes receive two BREAK_MESSAGES
          this._stopReason = BREAKPOINT;
        }
        break;
      case (_DbgpSocket || _load_DbgpSocket()).CONNECTION_STATUS.DUMMY_IS_VIEWABLE:
        this._isDummyViewable = true;
        return;
      case (_DbgpSocket || _load_DbgpSocket()).CONNECTION_STATUS.DUMMY_IS_HIDDEN:
        this._isDummyViewable = false;
        return;
    }
    if (newStatus === (_DbgpSocket || _load_DbgpSocket()).CONNECTION_STATUS.BREAK_MESSAGE_RECEIVED && prevStatus !== (_DbgpSocket || _load_DbgpSocket()).CONNECTION_STATUS.BREAK_MESSAGE_SENT) {
      return;
    }
    this._status = newStatus;
    if (!this._isInternalStatus(newStatus)) {
      for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
        args[_key2 - 2] = arguments[_key2];
      }

      // Don't bubble up irrelevant statuses to the multiplexer
      // TODO(dbonafilia): Add Enums to make status association clearer
      return callback(newStatus, ...args);
    }
  }

  _isInternalStatus(status) {
    return [(_DbgpSocket || _load_DbgpSocket()).CONNECTION_STATUS.BREAK_MESSAGE_RECEIVED, (_DbgpSocket || _load_DbgpSocket()).CONNECTION_STATUS.BREAK_MESSAGE_SENT, (_DbgpSocket || _load_DbgpSocket()).CONNECTION_STATUS.DUMMY_IS_HIDDEN, (_DbgpSocket || _load_DbgpSocket()).CONNECTION_STATUS.DUMMY_IS_VIEWABLE].some(internalStatus => internalStatus === status);
  }

  /**
   * We only want to show the dummy connection's IP to the user when it is outside the entry-point
   * specified by the user in the Debugger config.
   */
  isViewable() {
    if (this._isDummyConnection) {
      return this._status === (_DbgpSocket || _load_DbgpSocket()).CONNECTION_STATUS.BREAK && this._isDummyViewable;
    } else {
      return this._status === (_DbgpSocket || _load_DbgpSocket()).CONNECTION_STATUS.BREAK;
    }
  }

  onNotification(callback) {
    return this._socket.onNotification(callback);
  }

  evaluateOnCallFrame(frameIndex, expression) {
    return this._dataCache.evaluateOnCallFrame(frameIndex, expression);
  }

  runtimeEvaluate(frameIndex, expression) {
    return this._dataCache.runtimeEvaluate(frameIndex, expression);
  }

  setExceptionBreakpoint(exceptionName) {
    return this._socket.setExceptionBreakpoint(exceptionName);
  }

  setFileLineBreakpoint(breakpointInfo) {
    return this._socket.setFileLineBreakpoint(breakpointInfo);
  }

  getBreakpoint(breakpointId) {
    return this._socket.getBreakpoint(breakpointId);
  }

  removeBreakpoint(breakpointId) {
    return this._socket.removeBreakpoint(breakpointId);
  }

  getStackFrames() {
    return this._socket.getStackFrames();
  }

  getScopesForFrame(frameIndex) {
    return this._dataCache.getScopesForFrame(frameIndex);
  }

  getStatus() {
    return this._status;
  }

  sendContinuationCommand(command) {
    return this._socket.sendContinuationCommand(command);
  }

  sendStdoutRequest() {
    return this._socket.sendStdoutRequest();
  }

  sendStderrRequest() {
    return this._socket.sendStderrRequest();
  }

  sendBreakCommand() {
    this._status = (_DbgpSocket || _load_DbgpSocket()).CONNECTION_STATUS.BREAK_MESSAGE_SENT;
    return this._socket.sendBreakCommand();
  }

  setFeature(name, value) {
    return this._socket.setFeature(name, value);
  }

  getProperties(remoteId) {
    return this._dataCache.getProperties(remoteId);
  }

  getStopReason() {
    return this._stopReason;
  }

  dispose() {
    this._disposables.dispose();
    this._socket.dispose();
  }
};