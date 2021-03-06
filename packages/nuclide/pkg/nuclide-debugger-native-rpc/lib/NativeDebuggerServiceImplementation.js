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
exports.NativeDebuggerService = exports.getAttachTargetInfoList = undefined;

var _asyncToGenerator = _interopRequireDefault(require('async-to-generator'));

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

let getAttachTargetInfoList = exports.getAttachTargetInfoList = (() => {
  var _ref = (0, _asyncToGenerator.default)(function* (targetPid) {
    // Get processes list from ps utility.
    // -e: include all processes, does not require -ww argument since truncation of process names is
    //     done by the OS, not the ps utility
    const pidToName = new Map();
    const processes = yield (0, (_process || _load_process()).checkOutput)('ps', ['-e', '-o', 'pid,comm'], {});
    processes.stdout.toString().split('\n').slice(1).forEach(function (line) {
      const words = line.trim().split(' ');
      const pid = Number(words[0]);
      const command = words.slice(1).join(' ');
      const components = command.split('/');
      const name = components[components.length - 1];
      pidToName.set(pid, name);
    });
    // Get processes list from ps utility.
    // -e: include all processes
    // -ww: provides unlimited width for output and prevents the truncating of command names by ps.
    // -o pid,args: custom format the output to be two columns(pid and command name)
    const pidToCommand = new Map();
    const commands = yield (0, (_process || _load_process()).checkOutput)('ps', ['-eww', '-o', 'pid,args'], {});
    commands.stdout.toString().split('\n').slice(1).forEach(function (line) {
      const words = line.trim().split(' ');
      const pid = Number(words[0]);
      const command = words.slice(1).join(' ');
      pidToCommand.set(pid, command);
    });
    // Filter out processes that have died in between ps calls and zombiue processes.
    // Place pid, process, and command info into AttachTargetInfo objects and return in an array.
    return Array.from(pidToName.entries()).filter(function (arr) {
      var _arr = _slicedToArray(arr, 2);

      const pid = _arr[0],
            name = _arr[1];

      if (targetPid != null) {
        return pid === targetPid;
      }
      return pidToCommand.has(pid) && !(name.startsWith('(') && name.endsWith(')')) && (name.length < 9 || name.slice(-9) !== '<defunct>');
    }).map(function (arr) {
      var _arr2 = _slicedToArray(arr, 2);

      const pid = _arr2[0],
            name = _arr2[1];

      const commandName = pidToCommand.get(pid);

      if (!(commandName != null)) {
        throw new Error('Invariant violation: "commandName != null"');
      }

      return {
        pid: pid,
        name: name,
        commandName: commandName
      };
    });
  });

  return function getAttachTargetInfoList(_x) {
    return _ref.apply(this, arguments);
  };
})();

var _child_process = _interopRequireDefault(require('child_process'));

var _nuclideUri;

function _load_nuclideUri() {
  return _nuclideUri = _interopRequireDefault(require('../../commons-node/nuclideUri'));
}

var _nuclideDebuggerCommon;

function _load_nuclideDebuggerCommon() {
  return _nuclideDebuggerCommon = require('../../nuclide-debugger-common');
}

var _stream;

function _load_stream() {
  return _stream = require('../../commons-node/stream');
}

var _observable;

function _load_observable() {
  return _observable = require('../../commons-node/observable');
}

var _process;

function _load_process() {
  return _process = require('../../commons-node/process');
}

var _rxjsBundlesRxMinJs = require('rxjs/bundles/Rx.min.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let NativeDebuggerService = exports.NativeDebuggerService = class NativeDebuggerService extends (_nuclideDebuggerCommon || _load_nuclideDebuggerCommon()).DebuggerRpcWebSocketService {

  constructor(config) {
    super('native');
    this._config = config;
    this.getLogger().setLogLevel(config.logLevel);
  }

  attach(attachInfo) {
    this.getLogger().log(`attach process: ${ JSON.stringify(attachInfo) }`);
    const inferiorArguments = {
      pid: String(attachInfo.pid),
      basepath: attachInfo.basepath ? attachInfo.basepath : this._config.buckConfigRootFile
    };
    return _rxjsBundlesRxMinJs.Observable.fromPromise(this._startDebugging(inferiorArguments)).publish();
  }

  launch(launchInfo) {
    this.getLogger().log(`launch process: ${ JSON.stringify(launchInfo) }`);
    const inferiorArguments = {
      executable_path: launchInfo.executablePath,
      launch_arguments: launchInfo.arguments,
      launch_environment_variables: launchInfo.environmentVariables,
      working_directory: launchInfo.workingDirectory,
      stdin_filepath: launchInfo.stdinFilePath ? launchInfo.stdinFilePath : '',
      basepath: launchInfo.basepath ? launchInfo.basepath : this._config.buckConfigRootFile,
      lldb_python_path: launchInfo.lldbPythonPath
    };
    return _rxjsBundlesRxMinJs.Observable.fromPromise(this._startDebugging(inferiorArguments)).publish();
  }

  _startDebugging(inferiorArguments) {
    var _this = this;

    return (0, _asyncToGenerator.default)(function* () {
      const lldbProcess = _this._spawnPythonBackend();
      lldbProcess.on('exit', _this._handleLLDBExit.bind(_this));
      _this._registerIpcChannel(lldbProcess);
      _this._sendArgumentsToPythonBackend(lldbProcess, inferiorArguments);
      const lldbWebSocketListeningPort = yield _this._connectWithLLDB(lldbProcess);

      // TODO[jeffreytan]: explicitly use ipv4 address 127.0.0.1 for now.
      // Investigate if we can use localhost and match protocol version between client/server.
      const lldbWebSocketAddress = `ws://127.0.0.1:${ lldbWebSocketListeningPort }/`;
      yield _this.connectToWebSocketServer(lldbWebSocketAddress);
      _this.getLogger().log(`Connected with lldb at address: ${ lldbWebSocketAddress }`);
    })();
  }

  _registerIpcChannel(lldbProcess) {
    const IPC_CHANNEL_FD = 4;
    /* $FlowFixMe - update Flow defs for ChildProcess */
    const ipcStream = lldbProcess.stdio[IPC_CHANNEL_FD];
    this.getSubscriptions().add((0, (_observable || _load_observable()).splitStream)((0, (_stream || _load_stream()).observeStream)(ipcStream)).subscribe(this._handleIpcMessage.bind(this, ipcStream), error => this.getLogger().logError(`ipcStream error: ${ JSON.stringify(error) }`)));
  }

  _handleIpcMessage(ipcStream, message) {
    this.getLogger().logTrace(`ipc message: ${ message }`);
    const messageJson = JSON.parse(message);
    if (messageJson.type === 'Nuclide.userOutput') {
      // Write response message to ipc for sync message.
      if (messageJson.isSync) {
        ipcStream.write(JSON.stringify({
          message_id: messageJson.id
        }) + '\n');
      }
      this.getClientCallback().sendUserOutputMessage(JSON.stringify(messageJson.message));
    } else {
      this.getLogger().logError(`Unknown message: ${ message }`);
    }
  }

  _spawnPythonBackend() {
    const lldbPythonScriptPath = (_nuclideUri || _load_nuclideUri()).default.join(__dirname, '../scripts/main.py');
    const python_args = [lldbPythonScriptPath, '--arguments_in_json'];
    const options = {
      cwd: (_nuclideUri || _load_nuclideUri()).default.dirname(lldbPythonScriptPath),
      // FD[3] is used for sending arguments JSON blob.
      // FD[4] is used as a ipc channel for output/atom notifications.
      stdio: ['pipe', 'pipe', 'pipe', 'pipe', 'pipe'],
      detached: false };
    this.getLogger().logInfo(`spawn child_process: ${ JSON.stringify(python_args) }`);
    const lldbProcess = _child_process.default.spawn(this._config.pythonBinaryPath, python_args, options);
    this.getSubscriptions().add(() => lldbProcess.kill());
    return lldbProcess;
  }

  _sendArgumentsToPythonBackend(child, args) {
    const ARGUMENT_INPUT_FD = 3;
    /* $FlowFixMe - update Flow defs for ChildProcess */
    const argumentsStream = child.stdio[ARGUMENT_INPUT_FD];
    // Make sure the bidirectional communication channel is set up before
    // sending data.
    argumentsStream.write('init\n');
    this.getSubscriptions().add((0, (_stream || _load_stream()).observeStream)(argumentsStream).first().subscribe(text => {
      if (text.startsWith('ready')) {
        const args_in_json = JSON.stringify(args);
        this.getLogger().logInfo(`Sending ${ args_in_json } to child_process`);
        argumentsStream.write(`${ args_in_json }\n`);
      } else {
        this.getLogger().logError(`Get unknown initial data: ${ text }.`);
        child.kill();
      }
    }, error => this.getLogger().logError(`argumentsStream error: ${ JSON.stringify(error) }`)));
  }

  _connectWithLLDB(lldbProcess) {
    this.getLogger().log('connecting with lldb');
    return new Promise((resolve, reject) => {
      // Async handle parsing websocket address from the stdout of the child.
      lldbProcess.stdout.on('data', chunk => {
        // stdout should hopefully be set to line-buffering, in which case the
        const block = chunk.toString();
        this.getLogger().log(`child process(${ lldbProcess.pid }) stdout: ${ block }`);
        const result = /Port: (\d+)\n/.exec(block);
        if (result != null) {
          // $FlowIssue - flow has wrong typing for it(t9649946).
          lldbProcess.stdout.removeAllListeners(['data', 'error', 'exit']);
          resolve(result[1]);
        }
      });
      lldbProcess.stderr.on('data', chunk => {
        const errorMessage = chunk.toString();
        this.getClientCallback().sendUserOutputMessage(JSON.stringify({
          level: 'error',
          text: errorMessage
        }));
        this.getLogger().logError(`child process(${ lldbProcess.pid }) stderr: ${ errorMessage }`);
      });
      lldbProcess.on('error', () => {
        reject('lldb process error');
      });
      lldbProcess.on('exit', () => {
        reject('lldb process exit');
      });
    });
  }

  _handleLLDBExit() {
    // Fire and forget.
    this.dispose();
  }
};