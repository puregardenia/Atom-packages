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
exports.WatchExpressionStore = undefined;

var _asyncToGenerator = _interopRequireDefault(require('async-to-generator'));

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _DebuggerStore;

function _load_DebuggerStore() {
  return _DebuggerStore = require('./DebuggerStore');
}

var _DebuggerDispatcher;

function _load_DebuggerDispatcher() {
  return _DebuggerDispatcher = require('./DebuggerDispatcher');
}

var _rxjsBundlesRxMinJs = require('rxjs/bundles/Rx.min.js');

var _UniversalDisposable;

function _load_UniversalDisposable() {
  return _UniversalDisposable = _interopRequireDefault(require('../../commons-node/UniversalDisposable'));
}

var _promise;

function _load_promise() {
  return _promise = require('../../commons-node/promise');
}

var _nuclideLogging;

function _load_nuclideLogging() {
  return _nuclideLogging = require('../../nuclide-logging');
}

var _normalizeRemoteObjectValue;

function _load_normalizeRemoteObjectValue() {
  return _normalizeRemoteObjectValue = require('./normalizeRemoteObjectValue');
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let WatchExpressionStore = exports.WatchExpressionStore = class WatchExpressionStore {

  constructor(dispatcher, bridge) {
    this._evaluationId = 0;
    this._isPaused = false;
    this._bridge = bridge;
    this._disposables = new (_UniversalDisposable || _load_UniversalDisposable()).default();
    this._watchExpressions = new Map();
    this._evaluationRequestsInFlight = new Map();
    this._disposables.add(() => this._watchExpressions.clear());
    // `this._previousEvaluationSubscriptions` can change at any time and are a distinct subset of
    // `this._disposables`.
    this._previousEvaluationSubscriptions = new (_UniversalDisposable || _load_UniversalDisposable()).default();
    this._disposables.add(this._previousEvaluationSubscriptions);
    const _dispatcherToken = dispatcher.register(this._handlePayload.bind(this));
    this._disposables.add(() => {
      dispatcher.unregister(_dispatcherToken);
    });
  }

  _handlePayload(payload) {
    switch (payload.actionType) {
      case (_DebuggerDispatcher || _load_DebuggerDispatcher()).ActionTypes.CLEAR_INTERFACE:
        {
          this._clearEvaluationValues();
          break;
        }
      case (_DebuggerDispatcher || _load_DebuggerDispatcher()).ActionTypes.DEBUGGER_MODE_CHANGE:
        {
          this._isPaused = false;
          if (payload.data === (_DebuggerStore || _load_DebuggerStore()).DebuggerMode.PAUSED) {
            this._isPaused = true;
            this._triggerReevaluation();
          } else if (payload.data === (_DebuggerStore || _load_DebuggerStore()).DebuggerMode.STOPPED) {
            this._cancelRequestsToBridge();
            this._clearEvaluationValues();
          }
          break;
        }
      case (_DebuggerDispatcher || _load_DebuggerDispatcher()).ActionTypes.RECEIVED_GET_PROPERTIES_RESPONSE:
        {
          var _payload$data = payload.data;
          const id = _payload$data.id,
                response = _payload$data.response;

          this._handleResponseForPendingRequest(id, response);
          break;
        }
      case (_DebuggerDispatcher || _load_DebuggerDispatcher()).ActionTypes.RECEIVED_EXPRESSION_EVALUATION_RESPONSE:
        {
          var _payload$data2 = payload.data;
          const id = _payload$data2.id,
                response = _payload$data2.response;

          response.result = (0, (_normalizeRemoteObjectValue || _load_normalizeRemoteObjectValue()).normalizeRemoteObjectValue)(response.result);
          this._handleResponseForPendingRequest(id, response);
          break;
        }
      default:
        {
          return;
        }
    }
  }

  _triggerReevaluation() {
    this._cancelRequestsToBridge();
    for (const _ref of this._watchExpressions) {
      var _ref2 = _slicedToArray(_ref, 2);

      const expression = _ref2[0];
      const subject = _ref2[1];

      if (subject.observers == null || subject.observers.length === 0) {
        // Nobody is watching this expression anymore.
        this._watchExpressions.delete(expression);
        continue;
      }
      this._requestExpressionEvaluation(expression, subject, false /* no REPL support */);
    }
  }

  _cancelRequestsToBridge() {
    this._previousEvaluationSubscriptions.dispose();
    this._previousEvaluationSubscriptions = new (_UniversalDisposable || _load_UniversalDisposable()).default();
  }

  // Resets all values to N/A, for examples when the debugger resumes or stops.
  _clearEvaluationValues() {
    for (const subject of this._watchExpressions.values()) {
      subject.next(null);
    }
  }

  /**
   * Returns an observable of child properties for the given objectId.
   * Resources are automatically cleaned up once all subscribers of an expression have unsubscribed.
   */
  getProperties(objectId) {
    const getPropertiesPromise = this._sendEvaluationCommand('getProperties', objectId);
    return _rxjsBundlesRxMinJs.Observable.fromPromise(getPropertiesPromise);
  }

  evaluateConsoleExpression(expression) {
    return this._evaluateExpression(expression, true /* support REPL */);
  }

  evaluateWatchExpression(expression) {
    return this._evaluateExpression(expression, false /* do not support REPL */);
  }

  /**
   * Returns an observable of evaluation results for a given expression.
   * Resources are automatically cleaned up once all subscribers of an expression have unsubscribed.
   *
   * The supportRepl boolean indicates if we allow evaluation in a non-paused state.
   */
  _evaluateExpression(expression, supportRepl) {
    if (!supportRepl && this._watchExpressions.has(expression)) {
      const cachedResult = this._watchExpressions.get(expression);

      if (!cachedResult) {
        throw new Error('Invariant violation: "cachedResult"');
      }

      return cachedResult;
    }
    const subject = new _rxjsBundlesRxMinJs.BehaviorSubject();
    this._requestExpressionEvaluation(expression, subject, supportRepl);
    if (!supportRepl) {
      this._watchExpressions.set(expression, subject);
    }
    // Expose an observable rather than the raw subject.
    return subject.asObservable();
  }

  _requestExpressionEvaluation(expression, subject, supportRepl) {
    let evaluationPromise;
    if (supportRepl) {
      evaluationPromise = this._isPaused ? this._evaluateOnSelectedCallFrame(expression, 'console') : this._runtimeEvaluate(expression);
    } else {
      evaluationPromise = this._evaluateOnSelectedCallFrame(expression, 'watch-group');
    }

    const evaluationDisposable = new (_UniversalDisposable || _load_UniversalDisposable()).default(_rxjsBundlesRxMinJs.Observable.fromPromise(evaluationPromise).merge(_rxjsBundlesRxMinJs.Observable.never()) // So that we do not unsubscribe `subject` when disposed.
    .subscribe(subject));

    // Non-REPL environments will want to record these requests so they can be canceled on
    // re-evaluation, e.g. in the case of stepping.  REPL environments should let them complete so
    // we can have e.g. a history of evaluations in the console.
    if (!supportRepl) {
      this._previousEvaluationSubscriptions.add(evaluationDisposable);
    } else {
      this._disposables.add(evaluationDisposable);
    }
  }

  _evaluateOnSelectedCallFrame(expression, objectGroup) {
    var _this = this;

    return (0, _asyncToGenerator.default)(function* () {
      const result = yield _this._sendEvaluationCommand('evaluateOnSelectedCallFrame', expression, objectGroup);
      if (result == null) {
        // TODO: It would be nice to expose a better error from the backend here.
        return {
          type: 'text',
          value: `Failed to evaluate: ${ expression }`
        };
      } else {
        return result;
      }
    })();
  }

  _runtimeEvaluate(expression) {
    var _this2 = this;

    return (0, _asyncToGenerator.default)(function* () {
      const result = yield _this2._sendEvaluationCommand('runtimeEvaluate', expression);
      if (result == null) {
        // TODO: It would be nice to expose a better error from the backend here.
        return {
          type: 'text',
          value: `Failed to evaluate: ${ expression }`
        };
      } else {
        return result;
      }
    })();
  }

  _sendEvaluationCommand(command) {
    var _this3 = this,
        _arguments = arguments;

    return (0, _asyncToGenerator.default)(function* () {
      const deferred = new (_promise || _load_promise()).Deferred();
      const evalId = _this3._evaluationId;
      ++_this3._evaluationId;
      _this3._evaluationRequestsInFlight.set(evalId, deferred);

      for (var _len = _arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = _arguments[_key];
      }

      _this3._bridge.sendEvaluationCommand(command, evalId, ...args);
      let result = null;
      try {
        result = yield deferred.promise;
      } catch (e) {
        (0, (_nuclideLogging || _load_nuclideLogging()).getLogger)().warn(`${ command }: Error getting result.`, e);
      }
      _this3._evaluationRequestsInFlight.delete(evalId);
      return result;
    })();
  }

  _handleResponseForPendingRequest(id, response) {
    const result = response.result,
          error = response.error;

    const deferred = this._evaluationRequestsInFlight.get(id);
    if (deferred == null) {
      // Nobody is listening for the result of this expression.
      return;
    }
    if (error != null) {
      deferred.reject(error);
    } else {
      deferred.resolve(result);
    }
  }

  dispose() {
    this._disposables.dispose();
  }
};