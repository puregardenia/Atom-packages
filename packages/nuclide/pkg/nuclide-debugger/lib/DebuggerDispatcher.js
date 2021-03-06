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
exports.default = exports.ActionTypes = undefined;

var _Dispatcher;

function _load_Dispatcher() {
  return _Dispatcher = _interopRequireDefault(require('../../commons-node/Dispatcher'));
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const ActionTypes = exports.ActionTypes = Object.freeze({
  SET_DEBUGGER_INSTANCE: 'SET_DEBUGGER_INSTANCE',
  SET_ERROR: 'SET_ERROR',
  SET_PROCESS_SOCKET: 'SET_PROCESS_SOCKET',
  DEBUGGER_MODE_CHANGE: 'DEBUGGER_MODE_CHANGE',
  ADD_DEBUGGER_PROVIDER: 'ADD_DEBUGGER_PROVIDER',
  REMOVE_DEBUGGER_PROVIDER: 'REMOVE_DEBUGGER_PROVIDER',
  UPDATE_CONNECTIONS: 'UPDATE_CONNECTIONS',
  ADD_EVALUATION_EXPRESSION_PROVIDER: 'ADD_EVALUATION_EXPRESSION_PROVIDER',
  REMOVE_EVALUATION_EXPRESSION_PROVIDER: 'REMOVE_EVALUATION_EXPRESSION_PROVIDER',
  ADD_WATCH_EXPRESSION: 'ADD_WATCH_EXPRESSION',
  REMOVE_WATCH_EXPRESSION: 'REMOVE_WATCH_EXPRESSION',
  UPDATE_WATCH_EXPRESSION: 'UPDATE_WATCH_EXPRESSION',
  TRIGGER_DEBUGGER_ACTION: 'TRIGGER_DEBUGGER_ACTION',
  ADD_REGISTER_EXECUTOR: 'ADD_REGISTER_EXECUTOR',
  REMOVE_REGISTER_EXECUTOR: 'REMOVE_REGISTER_EXECUTOR',
  REGISTER_CONSOLE: 'REGISTER_CONSOLE',
  UNREGISTER_CONSOLE: 'UNREGISTER_CONSOLE',
  UPDATE_CALLSTACK: 'UPDATE_CALLSTACK',
  OPEN_SOURCE_LOCATION: 'OPEN_SOURCE_LOCATION',
  CLEAR_INTERFACE: 'CLEAR_INTERFACE',
  SET_SELECTED_CALLFRAME_LINE: 'SET_SELECTED_CALLFRAME_LINE',
  ADD_BREAKPOINT: 'ADD_BREAKPOINT',
  UPDATE_BREAKPOINT_CONDITION: 'UPDATE_BREAKPOINT_CONDITION',
  UPDATE_BREAKPOINT_ENABLED: 'UPDATE_BREAKPOINT_ENABLED',
  DELETE_BREAKPOINT: 'DELETE_BREAKPOINT',
  DELETE_ALL_BREAKPOINTS: 'DELETE_ALL_BREAKPOINTS',
  TOGGLE_BREAKPOINT: 'TOGGLE_BREAKPOINT',
  DELETE_BREAKPOINT_IPC: 'DELETE_BREAKPOINT_IPC',
  BIND_BREAKPOINT_IPC: 'BIND_BREAKPOINT_IPC',
  UPDATE_LOCALS: 'UPDATE_LOCALS',
  TOGGLE_PAUSE_ON_EXCEPTION: 'TOGGLE_PAUSE_ON_EXCEPTION',
  TOGGLE_PAUSE_ON_CAUGHT_EXCEPTION: 'TOGGLE_PAUSE_ON_CAUGHT_EXCEPTION',
  UPDATE_THREADS: 'UPDATE_THREADS',
  UPDATE_THREAD: 'UPDATE_THREAD',
  UPDATE_STOP_THREAD: 'UPDATE_STOP_THREAD',
  NOTIFY_THREAD_SWITCH: 'NOTIFY_THREAD_SWITCH',
  TOGGLE_SINGLE_THREAD_STEPPING: 'TOGGLE_SINGLE_THREAD_STEPPING',
  RECEIVED_EXPRESSION_EVALUATION_RESPONSE: 'RECEIVED_EXPRESSION_EVALUATION_RESPONSE',
  RECEIVED_GET_PROPERTIES_RESPONSE: 'RECEIVED_GET_PROPERTIES_RESPONSE',
  UPDATE_CUSTOM_CONTROL_BUTTONS: 'UPDATE_CUSTOM_CONTROL_BUTTONS'
});

// Flow hack: Every DebuggerAction actionType must be in ActionTypes.
'';

let DebuggerDispatcher = class DebuggerDispatcher extends (_Dispatcher || _load_Dispatcher()).default {};
exports.default = DebuggerDispatcher;