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
exports.createProcessStream = createProcessStream;

var _process;

function _load_process() {
  return _process = require('../../commons-node/process');
}

var _featureConfig;

function _load_featureConfig() {
  return _featureConfig = _interopRequireDefault(require('../../commons-atom/featureConfig'));
}

var _os = _interopRequireDefault(require('os'));

var _nuclideUri;

function _load_nuclideUri() {
  return _nuclideUri = _interopRequireDefault(require('../../commons-node/nuclideUri'));
}

var _rxjsBundlesRxMinJs = require('rxjs/bundles/Rx.min.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const VALID_UDID = /^[a-f0-9-]+$/i;function createProcessStream() {
  const currentDeviceUdids = (0, (_process || _load_process()).observeProcess)(spawnCurrentDeviceMonitor).map(event => {
    if (event.kind === 'error') {
      throw event.error;
    } else if (event.kind === 'exit' && event.exitCode !== 0) {
      throw new Error('Error getting active iOS Simulator');
    }
    return event;
  }).filter(event => event.kind === 'stdout').map(event => {
    if (!(typeof event.data === 'string')) {
      throw new Error('Invariant violation: "typeof event.data === \'string\'"');
    }

    return event.data;
  }).map(output => output.trim()).filter(udid => VALID_UDID.test(udid)).distinctUntilChanged();

  // Whenever the current device changes, start tailing that device's logs.
  return currentDeviceUdids.switchMap(udid => (0, (_process || _load_process()).observeProcess)(() => tailDeviceLogs(udid)).map(event => {
    if (event.kind === 'error') {
      throw event.error;
    }
    return event;
  }).filter(event => event.kind === 'stdout').map(event => {
    if (!(typeof event.data === 'string')) {
      throw new Error('Invariant violation: "typeof event.data === \'string\'"');
    }

    return event.data;
  }));
}

// A small shell script for polling the current device UDID. This allows us to avoid spawning a new
// process every interval.
const WATCH_CURRENT_UDID_SCRIPT = `
  set -e;
  while true; do
    defaults read com.apple.iphonesimulator CurrentDeviceUDID;
    sleep 2;
  done;
`;

const spawnCurrentDeviceMonitor = () => (0, (_process || _load_process()).safeSpawn)('bash', ['-c', WATCH_CURRENT_UDID_SCRIPT]);

function tailDeviceLogs(udid) {
  const logDir = (_nuclideUri || _load_nuclideUri()).default.join(_os.default.homedir(), 'Library', 'Logs', 'CoreSimulator', udid, 'asl');
  return (0, (_process || _load_process()).safeSpawn)((_featureConfig || _load_featureConfig()).default.get('nuclide-ios-simulator-logs.pathToSyslog'), ['-w', '-F', 'xml', '-d', logDir]);
}