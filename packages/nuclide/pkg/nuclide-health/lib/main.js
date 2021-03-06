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

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

// Imports from non-Nuclide modules.


// Imports from other Nuclide packages.


// Imports from within this Nuclide package.


var _atom = require('atom');

var _reactForAtom = require('react-for-atom');

var _rxjsBundlesRxMinJs = require('rxjs/bundles/Rx.min.js');

var _nuclideAnalytics;

function _load_nuclideAnalytics() {
  return _nuclideAnalytics = require('../../nuclide-analytics');
}

var _createPackage;

function _load_createPackage() {
  return _createPackage = _interopRequireDefault(require('../../commons-atom/createPackage'));
}

var _viewableFromReactElement;

function _load_viewableFromReactElement() {
  return _viewableFromReactElement = require('../../commons-atom/viewableFromReactElement');
}

var _featureConfig;

function _load_featureConfig() {
  return _featureConfig = _interopRequireDefault(require('../../commons-atom/featureConfig'));
}

var _UniversalDisposable;

function _load_UniversalDisposable() {
  return _UniversalDisposable = _interopRequireDefault(require('../../commons-node/UniversalDisposable'));
}

var _observable;

function _load_observable() {
  return _observable = require('../../commons-node/observable');
}

var _HealthPaneItem;

function _load_HealthPaneItem() {
  return _HealthPaneItem = _interopRequireDefault(require('./HealthPaneItem'));
}

var _getChildProcessesTree;

function _load_getChildProcessesTree() {
  return _getChildProcessesTree = _interopRequireDefault(require('./getChildProcessesTree'));
}

var _getStats;

function _load_getStats() {
  return _getStats = _interopRequireDefault(require('./getStats'));
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let Activation = class Activation {

  constructor(state) {
    this._updateAnalytics = this._updateAnalytics.bind(this);
    this._updateToolbarJewel = this._updateToolbarJewel.bind(this);

    // Observe all of the settings.
    const configs = (_featureConfig || _load_featureConfig()).default.observeAsStream('nuclide-health');
    const viewTimeouts = configs.map(config => config.viewTimeout * 1000).distinctUntilChanged();
    const analyticsTimeouts = configs.map(config => config.analyticsTimeout * 60 * 1000).distinctUntilChanged();
    const toolbarJewels = configs.map(config => config.toolbarJewel || '').distinctUntilChanged();

    // Update the stats immediately, and then periodically based on the config.
    const statsStream = _rxjsBundlesRxMinJs.Observable.of(null).concat(viewTimeouts.switchMap(_rxjsBundlesRxMinJs.Observable.interval)).map((_getStats || _load_getStats()).default).share();

    const childProcessesTreeStream = _rxjsBundlesRxMinJs.Observable.of(null).concat(viewTimeouts.switchMap(_rxjsBundlesRxMinJs.Observable.interval)).switchMap((_getChildProcessesTree || _load_getChildProcessesTree()).default).share();

    const packageStates = (0, (_observable || _load_observable()).cacheWhileSubscribed)(statsStream.withLatestFrom(toolbarJewels).map((_ref) => {
      var _ref2 = _slicedToArray(_ref, 2);

      let stats = _ref2[0],
          toolbarJewel = _ref2[1];
      return { stats: stats, toolbarJewel: toolbarJewel };
    }).share());

    const updateToolbarJewel = value => {
      (_featureConfig || _load_featureConfig()).default.set('nuclide-health.toolbarJewel', value);
    };
    this._paneItemStates = _rxjsBundlesRxMinJs.Observable.combineLatest(packageStates, _rxjsBundlesRxMinJs.Observable.of(null).concat(childProcessesTreeStream), (packageState, childProcessesTree) => Object.assign({}, packageState, {
      childProcessesTree: childProcessesTree,
      updateToolbarJewel: updateToolbarJewel
    }));

    this._subscriptions = new (_UniversalDisposable || _load_UniversalDisposable()).default(
    // Keep the toolbar jewel up-to-date.
    packageStates.map(formatToolbarJewelLabel).subscribe(this._updateToolbarJewel),

    // Buffer the stats and send analytics periodically.
    statsStream.buffer(analyticsTimeouts.switchMap(_rxjsBundlesRxMinJs.Observable.interval)).subscribe(this._updateAnalytics));
  }

  dispose() {
    this._subscriptions.dispose();
  }

  consumeToolBar(getToolBar) {
    const toolBar = getToolBar('nuclide-health');
    this._healthButton = toolBar.addButton({
      icon: 'dashboard',
      callback: 'nuclide-health:toggle',
      tooltip: 'Toggle Nuclide health stats',
      priority: -400
    }).element;
    this._healthButton.classList.add('nuclide-health-jewel');
    const disposable = new _atom.Disposable(() => {
      this._healthButton = null;
      toolBar.removeItems();
    });
    this._subscriptions.add(disposable);
    return disposable;
  }

  consumeWorkspaceViewsService(api) {
    if (!this._paneItemStates) {
      throw new Error('Invariant violation: "this._paneItemStates"');
    }

    this._subscriptions.add(api.registerFactory({
      id: 'nuclide-health',
      name: 'Health',
      iconName: 'dashboard',
      toggleCommand: 'nuclide-health:toggle',
      defaultLocation: 'pane',
      create: () => {
        if (!(this._paneItemStates != null)) {
          throw new Error('Invariant violation: "this._paneItemStates != null"');
        }

        return (0, (_viewableFromReactElement || _load_viewableFromReactElement()).viewableFromReactElement)(_reactForAtom.React.createElement((_HealthPaneItem || _load_HealthPaneItem()).default, { stateStream: this._paneItemStates }));
      },
      isInstance: item => item instanceof (_HealthPaneItem || _load_HealthPaneItem()).default
    }));
  }

  _updateToolbarJewel(label) {
    const healthButton = this._healthButton;
    if (healthButton != null) {
      healthButton.classList.toggle('updated', healthButton.dataset.jewelValue !== label);
      healthButton.dataset.jewelValue = label;
    }
  }

  _updateAnalytics(analyticsBuffer) {
    if (analyticsBuffer.length === 0) {
      return;
    }

    // Aggregates the buffered stats up by suffixing avg, min, max to their names.
    const aggregateStats = {};

    // All analyticsBuffer entries have the same keys; we use the first entry to know what they
    // are.
    Object.keys(analyticsBuffer[0]).forEach(statsKey => {
      // These values are not to be aggregated or sent.
      if (statsKey === 'activeHandlesByType') {
        return;
      }

      const aggregates = aggregate(analyticsBuffer.map(stats => typeof stats[statsKey] === 'number' ? stats[statsKey] : 0));
      Object.keys(aggregates).forEach(aggregatesKey => {
        const value = aggregates[aggregatesKey];
        if (value !== null && value !== undefined) {
          aggregateStats[`${ statsKey }_${ aggregatesKey }`] = value.toFixed(2);
        }
      });
    });
    (0, (_nuclideAnalytics || _load_nuclideAnalytics()).track)('nuclide-health', aggregateStats);
  }

};


function aggregate(values) {
  const avg = values.reduce((prevValue, currValue, index) => {
    return prevValue + (currValue - prevValue) / (index + 1);
  }, 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { avg: avg, min: min, max: max };
}

function formatToolbarJewelLabel(opts) {
  const stats = opts.stats,
        toolbarJewel = opts.toolbarJewel;

  switch (toolbarJewel) {
    case 'CPU':
      return `${ stats.cpuPercentage.toFixed(0) }%`;
    case 'Heap':
      return `${ stats.heapPercentage.toFixed(0) }%`;
    case 'Memory':
      return `${ Math.floor(stats.rss / 1024 / 1024) }M`;
    case 'Handles':
      return `${ stats.activeHandles }`;
    case 'Child processes':
      return `${ stats.activeHandlesByType.childprocess.length }`;
    case 'Event loop':
      return `${ stats.activeRequests }`;
    default:
      return '';
  }
}

exports.default = (0, (_createPackage || _load_createPackage()).default)(Activation);
module.exports = exports['default'];