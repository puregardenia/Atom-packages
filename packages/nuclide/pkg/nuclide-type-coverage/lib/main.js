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

var _asyncToGenerator = _interopRequireDefault(require('async-to-generator'));

let resultFunction = (() => {
  var _ref = (0, _asyncToGenerator.default)(function* (provider, editor) {
    const path = editor.getPath();
    if (path == null) {
      return null;
    }
    return yield provider.getCoverage(path);
  });

  return function resultFunction(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

exports.activate = activate;
exports.deactivate = deactivate;
exports.consumeCoverageProvider = consumeCoverageProvider;
exports.consumeStatusBar = consumeStatusBar;
exports.getDiagnosticsProvider = getDiagnosticsProvider;

var _reactForAtom = require('react-for-atom');

var _atom = require('atom');

var _rxjsBundlesRxMinJs = require('rxjs/bundles/Rx.min.js');

var _ActiveEditorRegistry;

function _load_ActiveEditorRegistry() {
  return _ActiveEditorRegistry = _interopRequireDefault(require('../../commons-atom/ActiveEditorRegistry'));
}

var _nuclideAnalytics;

function _load_nuclideAnalytics() {
  return _nuclideAnalytics = require('../../nuclide-analytics');
}

var _UniversalDisposable;

function _load_UniversalDisposable() {
  return _UniversalDisposable = _interopRequireDefault(require('../../commons-node/UniversalDisposable'));
}

var _StatusBarTile;

function _load_StatusBarTile() {
  return _StatusBarTile = require('./StatusBarTile');
}

var _coverageDiagnostics;

function _load_coverageDiagnostics() {
  return _coverageDiagnostics = require('./coverageDiagnostics');
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const STATUS_BAR_PRIORITY = 1000;let Activation = class Activation {

  constructor(state) {
    this._toggleEvents = new _rxjsBundlesRxMinJs.Subject();
    this._shouldRenderDiagnostics = this._toggleEvents.scan(prev => !prev, false);

    this._disposables = new (_UniversalDisposable || _load_UniversalDisposable()).default();
    this._activeEditorRegistry = new (_ActiveEditorRegistry || _load_ActiveEditorRegistry()).default(resultFunction, { updateOnEdit: false });

    this._disposables.add(atom.commands.add('atom-workspace', 'nuclide-type-coverage:toggle-inline-display', () => this._toggleEvents.next()));

    this._disposables.add(this._toggleEvents.subscribe(() => (0, (_nuclideAnalytics || _load_nuclideAnalytics()).track)('nuclide-type-coverage:toggle')));
  }

  consumeCoverageProvider(provider) {
    return this._activeEditorRegistry.consumeProvider(provider);
  }

  consumeStatusBar(statusBar) {
    const item = document.createElement('div');
    item.className = 'inline-block';

    const statusBarTile = statusBar.addLeftTile({
      item: item,
      priority: STATUS_BAR_PRIORITY
    });

    const resultStream = this._activeEditorRegistry.getResultsStream();
    _reactForAtom.ReactDOM.render(_reactForAtom.React.createElement((_StatusBarTile || _load_StatusBarTile()).StatusBarTile, {
      results: resultStream,
      isActive: this._shouldRenderDiagnostics,
      onClick: () => this._toggleEvents.next()
    }), item);
    const disposable = new _atom.Disposable(() => {
      _reactForAtom.ReactDOM.unmountComponentAtNode(item);
      statusBarTile.destroy();
    });
    this._disposables.add(disposable);
    return disposable;
  }

  getDiagnosticsProvider() {
    return (0, (_coverageDiagnostics || _load_coverageDiagnostics()).diagnosticProviderForResultStream)(this._activeEditorRegistry.getResultsStream(), this._shouldRenderDiagnostics);
  }

  dispose() {
    this._disposables.dispose();
  }
};


let activation = null;

function activate(state) {
  if (activation == null) {
    activation = new Activation(state);
  }
}

function deactivate() {
  if (activation != null) {
    activation.dispose();
    activation = null;
  }
}

function consumeCoverageProvider(provider) {
  if (!(activation != null)) {
    throw new Error('Invariant violation: "activation != null"');
  }

  return activation.consumeCoverageProvider(provider);
}

function consumeStatusBar(statusBar) {
  if (!(activation != null)) {
    throw new Error('Invariant violation: "activation != null"');
  }

  return activation.consumeStatusBar(statusBar);
}

function getDiagnosticsProvider() {
  if (!(activation != null)) {
    throw new Error('Invariant violation: "activation != null"');
  }

  return activation.getDiagnosticsProvider();
}