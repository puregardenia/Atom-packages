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

let createRemoteConnection = (() => {
  var _ref = (0, _asyncToGenerator.default)(function* (remoteProjectConfig) {
    const host = remoteProjectConfig.host,
          cwd = remoteProjectConfig.cwd,
          displayTitle = remoteProjectConfig.displayTitle;

    let connection = (_nuclideRemoteConnection || _load_nuclideRemoteConnection()).RemoteConnection.getByHostnameAndPath(host, cwd);
    if (connection != null) {
      return connection;
    }

    connection = yield (_nuclideRemoteConnection || _load_nuclideRemoteConnection()).RemoteConnection.createConnectionBySavedConfig(host, cwd, displayTitle);
    if (connection != null) {
      return connection;
    }

    // If connection fails using saved config, open connect dialog.
    return (0, (_openConnection || _load_openConnection()).openConnectionDialog)({
      initialServer: remoteProjectConfig.host,
      initialCwd: remoteProjectConfig.cwd
    });
  });

  return function createRemoteConnection(_x) {
    return _ref.apply(this, arguments);
  };
})();

/**
 * The same TextEditor must be returned to prevent Atom from creating multiple tabs
 * for the same file, because Atom doesn't cache pending opener promises.
 */
let createEditorForNuclide = (() => {
  var _ref2 = (0, _asyncToGenerator.default)(function* (uri) {
    try {
      let buffer;
      try {
        buffer = yield (0, (_loadingNotification || _load_loadingNotification()).default)((0, (_textEditor || _load_textEditor()).loadBufferForUri)(uri), `Opening \`${ (_nuclideUri || _load_nuclideUri()).default.nuclideUriToDisplayString(uri) }\`...`, 1000);
      } catch (err) {
        // Suppress ENOENT errors which occur if the file doesn't exist.
        // This is the same thing Atom does when opening a file (given a URI) that doesn't exist.
        if (err.code !== 'ENOENT') {
          throw err;
        }
        // If `loadBufferForURI` fails, then the buffer is removed from Atom's list of buffers.
        // `buffer.file` is marked as destroyed, making it useless. So we create
        // a new `buffer` and call `finishLoading` so that the `buffer` is marked
        // as `loaded` and the proper events are fired. The effect of all of this
        // is that files that don't exist remotely anymore are shown as empty
        // unsaved text editors.
        buffer = (0, (_textEditor || _load_textEditor()).bufferForUri)(uri);
        buffer.finishLoading();
      }
      // When in "large file mode", syntax highlighting and line wrapping are
      // disabled (among other things). This makes large files more usable.
      // Atom does this for local files.
      // https://github.com/atom/atom/blob/v1.9.8/src/workspace.coffee#L547
      const largeFileMode = buffer.getText().length > 2 * 1024 * 1024; // 2MB

      // In Atom 1.11.0, `buildTextEditor` will call `textEditorRegistry.maintainGrammar`
      // and `textEditorRegistry.maintainConfig` with the new editor. Since
      // `createEditorForNuclide` is called via `openURIInPane` -> `addOpener`,
      // that process will also call `maintainGrammar` and `maintainConfig`. This
      // results in `undefined` disposables created in `Workspace.subscribeToAddedItems`.
      // So when a pane is closed, the call to a non-existent `dispose` throws.
      if (typeof atom.textEditors.build === 'function') {
        // https://github.com/atom/atom/blob/v1.11.0-beta5/src/workspace.coffee#L564
        const editor = atom.textEditors.build({ buffer: buffer, largeFileMode: largeFileMode, autoHeight: false });
        return editor;
      } else {
        const editor = atom.workspace.buildTextEditor({ buffer: buffer, largeFileMode: largeFileMode });
        if (!atom.textEditors.editors.has(editor)) {
          // https://github.com/atom/atom/blob/v1.9.8/src/workspace.coffee#L559-L562
          const disposable = atom.textEditors.add(editor);
          editor.onDidDestroy(function () {
            disposable.dispose();
          });
        }
        return editor;
      }
    } catch (err) {
      logger.warn('buffer load issue:', err);
      atom.notifications.addError(`Failed to open ${ uri }: ${ err.message }`);
      throw err;
    }
  });

  return function createEditorForNuclide(_x2) {
    return _ref2.apply(this, arguments);
  };
})();

/**
 * Check if the remote buffer has already been initialized in editor.
 * This checks if the buffer is instance of NuclideTextBuffer.
 */


let reloadRemoteProjects = (() => {
  var _ref3 = (0, _asyncToGenerator.default)(function* (remoteProjects) {
    // This is intentionally serial.
    // The 90% use case is to have multiple remote projects for a single connection;
    // after the first one succeeds the rest should require no user action.
    for (const config of remoteProjects) {
      // eslint-disable-next-line babel/no-await-in-loop
      const connection = yield createRemoteConnection(config);
      if (!connection) {
        logger.info('No RemoteConnection returned on restore state trial:', config.host, config.cwd);
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'nuclide-file-tree:force-refresh-roots');

        // Atom restores remote files with a malformed URIs, which somewhat resemble local paths.
        // If after an unsuccessful connection user modifies and saves them he's presented
        // with a credential requesting dialog, as the file is attempted to be saved into
        // /nuclide:/<hostname> folder. If the user will approve the elevation and actually save
        // the file all kind of weird stuff happens (see t10842295) since the difference between the
        // remote and the valid local path becomes less aparent.
        // Anyway - these files better be closed.
        atom.workspace.getTextEditors().forEach(function (textEditor) {
          if (textEditor == null) {
            return;
          }

          const path = textEditor.getPath();
          if (path == null) {
            return;
          }

          if (path.startsWith(`nuclide:/${ config.host }`)) {
            textEditor.destroy();
          }
        });
      } else {
        // It's fine the user connected to a different project on the same host:
        // we should still be able to restore this using the new connection.
        const cwd = config.cwd,
              host = config.host,
              displayTitle = config.displayTitle;

        if (connection.getPathForInitialWorkingDirectory() !== cwd && connection.getRemoteHostname() === host) {
          // eslint-disable-next-line babel/no-await-in-loop
          yield (_nuclideRemoteConnection || _load_nuclideRemoteConnection()).RemoteConnection.createConnectionBySavedConfig(host, cwd, displayTitle);
        }
      }
    }
  });

  return function reloadRemoteProjects(_x3) {
    return _ref3.apply(this, arguments);
  };
})();

exports.activate = activate;
exports.consumeStatusBar = consumeStatusBar;
exports.serialize = serialize;
exports.deactivate = deactivate;
exports.createRemoteDirectoryProvider = createRemoteDirectoryProvider;
exports.createRemoteDirectorySearcher = createRemoteDirectorySearcher;
exports.getHomeFragments = getHomeFragments;

var _textEditor;

function _load_textEditor() {
  return _textEditor = require('../../commons-atom/text-editor');
}

var _nuclideLogging;

function _load_nuclideLogging() {
  return _nuclideLogging = require('../../nuclide-logging');
}

var _utils;

function _load_utils() {
  return _utils = require('./utils');
}

var _featureConfig;

function _load_featureConfig() {
  return _featureConfig = _interopRequireDefault(require('../../commons-atom/featureConfig'));
}

var _loadingNotification;

function _load_loadingNotification() {
  return _loadingNotification = _interopRequireDefault(require('../../commons-atom/loading-notification'));
}

var _atom = require('atom');

var _nuclideRemoteConnection;

function _load_nuclideRemoteConnection() {
  return _nuclideRemoteConnection = require('../../nuclide-remote-connection');
}

var _nuclideAnalytics;

function _load_nuclideAnalytics() {
  return _nuclideAnalytics = require('../../nuclide-analytics');
}

var _openConnection;

function _load_openConnection() {
  return _openConnection = require('./open-connection');
}

var _nuclideUri;

function _load_nuclideUri() {
  return _nuclideUri = _interopRequireDefault(require('../../commons-node/nuclideUri'));
}

var _RemoteDirectorySearcher;

function _load_RemoteDirectorySearcher() {
  return _RemoteDirectorySearcher = _interopRequireDefault(require('./RemoteDirectorySearcher'));
}

var _RemoteDirectoryProvider;

function _load_RemoteDirectoryProvider() {
  return _RemoteDirectoryProvider = _interopRequireDefault(require('./RemoteDirectoryProvider'));
}

var _RemoteProjectsController;

function _load_RemoteProjectsController() {
  return _RemoteProjectsController = _interopRequireDefault(require('./RemoteProjectsController'));
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const logger = (0, (_nuclideLogging || _load_nuclideLogging()).getLogger)();

/**
 * Stores the host and cwd of a remote connection.
 */


let packageSubscriptions = null;
let controller = null;

const CLOSE_PROJECT_DELAY_MS = 100;
const pendingFiles = {};

function createSerializableRemoteConnectionConfiguration(config) {
  return {
    host: config.host,
    cwd: config.cwd,
    displayTitle: config.displayTitle
  };
}

function addRemoteFolderToProject(connection) {
  const workingDirectoryUri = connection.getUriForInitialWorkingDirectory();
  // If restoring state, then the project already exists with local directory and wrong repo
  // instances. Hence, we remove it here, if existing, and add the new path for which we added a
  // workspace opener handler.
  atom.project.removePath(workingDirectoryUri);

  atom.project.addPath(workingDirectoryUri);

  const subscription = atom.project.onDidChangePaths(paths => {
    if (paths.indexOf(workingDirectoryUri) !== -1) {
      return;
    }

    // The project was removed from the tree.
    subscription.dispose();
    if (connection.isOnlyConnection()) {
      closeOpenFilesForRemoteProject(connection);
    }

    // Integration tests close the connection manually, so skip the rest.
    if (atom.inSpecMode()) {
      return;
    }

    // Delay closing the underlying socket connection until registered subscriptions have closed.
    // We should never depend on the order of registration of the `onDidChangePaths` event,
    // which also dispose consumed service's resources.
    setTimeout(closeRemoteConnection, CLOSE_PROJECT_DELAY_MS);
  });

  function closeRemoteConnection() {
    const hostname = connection.getRemoteHostname();
    const closeConnection = shutdownIfLast => {
      connection.close(shutdownIfLast);
    };

    if (!connection.isOnlyConnection()) {
      logger.info('Remaining remote projects using Nuclide Server - no prompt to shutdown');
      const shutdownIfLast = false;
      closeConnection(shutdownIfLast);
      return;
    }

    const confirmServerActionOnLastProject = (_featureConfig || _load_featureConfig()).default.get('nuclide-remote-projects.confirmServerActionOnLastProject');

    if (!(typeof confirmServerActionOnLastProject === 'boolean')) {
      throw new Error('Invariant violation: "typeof confirmServerActionOnLastProject === \'boolean\'"');
    }

    const shutdownServerAfterDisconnection = (_featureConfig || _load_featureConfig()).default.get('nuclide-remote-projects.shutdownServerAfterDisconnection');

    if (!(typeof shutdownServerAfterDisconnection === 'boolean')) {
      throw new Error('Invariant violation: "typeof shutdownServerAfterDisconnection === \'boolean\'"');
    }

    if (!confirmServerActionOnLastProject) {
      const shutdownIfLast = shutdownServerAfterDisconnection;
      closeConnection(shutdownIfLast);
      return;
    }

    const buttons = ['Keep It', 'Shutdown'];
    const buttonToActions = new Map();

    buttonToActions.set(buttons[0], () => closeConnection( /* shutdownIfLast */false));
    buttonToActions.set(buttons[1], () => closeConnection( /* shutdownIfLast */true));

    if (shutdownServerAfterDisconnection) {
      // Atom takes the first button in the list as default option.
      buttons.reverse();
    }

    const choice = global.atom.confirm({
      message: 'No more remote projects on the host: \'' + hostname + '\'. Would you like to shutdown Nuclide server there?',
      buttons: buttons
    });

    const action = buttonToActions.get(buttons[choice]);

    if (!action) {
      throw new Error('Invariant violation: "action"');
    }

    action();
  }
}

function closeOpenFilesForRemoteProject(connection) {
  const remoteProjectConfig = connection.getConfig();
  const openInstances = (0, (_utils || _load_utils()).getOpenFileEditorForRemoteProject)(remoteProjectConfig);
  for (const openInstance of openInstances) {
    const uri = openInstance.uri,
          editor = openInstance.editor,
          pane = openInstance.pane;
    // It's possible to open files outside of the root of the connection.
    // Only clean up these files if we're the only connection left.

    if (connection.isOnlyConnection() || (_nuclideUri || _load_nuclideUri()).default.contains(connection.getUriForInitialWorkingDirectory(), uri)) {
      pane.removeItem(editor);
      editor.destroy();
    }
  }
}

function getRemoteRootDirectories() {
  // TODO: Use nuclideUri instead.
  return atom.project.getDirectories().filter(directory => directory.getPath().startsWith('nuclide:'));
}

/**
 * Removes any Directory (not RemoteDirectory) objects that have Nuclide
 * remote URIs.
 */
function deleteDummyRemoteRootDirectories() {
  for (const directory of atom.project.getDirectories()) {
    if ((_nuclideUri || _load_nuclideUri()).default.isRemote(directory.getPath()) && !(_nuclideRemoteConnection || _load_nuclideRemoteConnection()).RemoteDirectory.isRemoteDirectory(directory)) {
      atom.project.removePath(directory.getPath());
    }
  }
}function isRemoteBufferInitialized(editor) {
  const buffer = editor.getBuffer();
  if (buffer && buffer.constructor.name === 'NuclideTextBuffer') {
    return true;
  }
  return false;
}

function shutdownServersAndRestartNuclide() {
  atom.confirm({
    message: 'This will shutdown your Nuclide servers and restart Atom, ' + 'discarding all unsaved changes. Continue?',
    buttons: {
      'Shutdown & Restart': (() => {
        var _ref4 = (0, _asyncToGenerator.default)(function* () {
          try {
            yield (0, (_nuclideAnalytics || _load_nuclideAnalytics()).trackImmediate)('nuclide-remote-projects:kill-and-restart');
          } finally {
            // This directly kills the servers without removing the RemoteConnections
            // so that restarting Nuclide preserves the existing workspace state.
            yield (_nuclideRemoteConnection || _load_nuclideRemoteConnection()).ServerConnection.forceShutdownAllServers();
            atom.reload();
          }
        });

        return function ShutdownRestart() {
          return _ref4.apply(this, arguments);
        };
      })(),
      'Cancel': () => {}
    }
  });
}

function activate(state) {
  const subscriptions = new _atom.CompositeDisposable();

  controller = new (_RemoteProjectsController || _load_RemoteProjectsController()).default();

  subscriptions.add((_nuclideRemoteConnection || _load_nuclideRemoteConnection()).RemoteConnection.onDidAddRemoteConnection(connection => {
    addRemoteFolderToProject(connection);

    // On Atom restart, it tries to open uri paths as local `TextEditor` pane items.
    // Here, Nuclide reloads the remote project files that have empty text editors open.
    const config = connection.getConfig();
    const openInstances = (0, (_utils || _load_utils()).getOpenFileEditorForRemoteProject)(config);
    for (const openInstance of openInstances) {
      // Keep the original open editor item with a unique name until the remote buffer is loaded,
      // Then, we are ready to replace it with the remote tab in the same pane.
      const pane = openInstance.pane,
            editor = openInstance.editor,
            uri = openInstance.uri,
            filePath = openInstance.filePath;

      // Skip restoring the editer who has remote content loaded.

      if (isRemoteBufferInitialized(editor)) {
        continue;
      }

      // Atom ensures that each pane only has one item per unique URI.
      // Null out the existing pane item's URI so we can insert the new one
      // without closing the pane.
      editor.getURI = () => null;
      // Cleanup the old pane item on successful opening or when no connection could be
      // established.
      const cleanupBuffer = () => {
        pane.removeItem(editor);
        editor.destroy();
      };
      if (filePath === config.cwd) {
        cleanupBuffer();
      } else {
        // If we clean up the buffer before the `openUriInPane` finishes,
        // the pane will be closed, because it could have no other items.
        // So we must clean up after.
        atom.workspace.openURIInPane(uri, pane).then(cleanupBuffer, cleanupBuffer);
      }
    }
  }));

  subscriptions.add(atom.commands.add('atom-workspace', 'nuclide-remote-projects:connect', () => (0, (_openConnection || _load_openConnection()).openConnectionDialog)()));

  subscriptions.add(atom.commands.add('atom-workspace', 'nuclide-remote-projects:kill-and-restart', () => shutdownServersAndRestartNuclide()));

  // Subscribe opener before restoring the remote projects.
  subscriptions.add(atom.workspace.addOpener(function () {
    let uri = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    if (uri.startsWith('nuclide:')) {
      const serverConnection = (_nuclideRemoteConnection || _load_nuclideRemoteConnection()).ServerConnection.getForUri(uri);
      if (serverConnection == null) {
        // It's possible that the URI opens before the remote connection has finished loading
        // (or the remote connection cannot be restored for some reason).
        //
        // In this case, we can just let Atom open a blank editor. Once the connection
        // is re-established, the `onDidAddRemoteConnection` logic above will restore the
        // editor contents as appropriate.
        return;
      }
      const connection = (_nuclideRemoteConnection || _load_nuclideRemoteConnection()).RemoteConnection.getForUri(uri);
      // On Atom restart, it tries to open the uri path as a file tab because it's not a local
      // directory. We can't let that create a file with the initial working directory path.
      if (connection != null && uri === connection.getUriForInitialWorkingDirectory()) {
        const blankEditor = atom.workspace.buildTextEditor({});
        // No matter what we do here, Atom is going to create a blank editor.
        // We don't want the user to see this, so destroy it as soon as possible.
        setImmediate(() => blankEditor.destroy());
        return blankEditor;
      }
      if (pendingFiles[uri]) {
        return pendingFiles[uri];
      }
      const textEditorPromise = pendingFiles[uri] = createEditorForNuclide(uri);
      const removeFromCache = () => delete pendingFiles[uri];
      textEditorPromise.then(removeFromCache, removeFromCache);
      return textEditorPromise;
    }
  }));

  // If RemoteDirectoryProvider is called before this, and it failed
  // to provide a RemoteDirectory for a
  // given URI, Atom will create a generic Directory to wrap that. We want
  // to delete these instead, because those directories aren't valid/useful
  // if they are not true RemoteDirectory objects (connected to a real
  // real remote folder).
  deleteDummyRemoteRootDirectories();

  // Attempt to reload previously open projects.
  const remoteProjectsConfig = state && state.remoteProjectsConfig;
  if (remoteProjectsConfig != null) {
    reloadRemoteProjects(remoteProjectsConfig);
  }
  packageSubscriptions = subscriptions;
}

function consumeStatusBar(statusBar) {
  if (controller) {
    controller.consumeStatusBar(statusBar);
  }
}

// TODO: All of the elements of the array are non-null, but it does not seem possible to convince
// Flow of that.
function serialize() {
  const remoteProjectsConfig = getRemoteRootDirectories().map(directory => {
    const connection = (_nuclideRemoteConnection || _load_nuclideRemoteConnection()).RemoteConnection.getForUri(directory.getPath());
    return connection ? createSerializableRemoteConnectionConfiguration(connection.getConfig()) : null;
  }).filter(config => config != null);
  return {
    remoteProjectsConfig: remoteProjectsConfig
  };
}

function deactivate() {
  if (packageSubscriptions) {
    packageSubscriptions.dispose();
    packageSubscriptions = null;
  }

  if (controller != null) {
    controller.destroy();
    controller = null;
  }
}

function createRemoteDirectoryProvider() {
  return new (_RemoteDirectoryProvider || _load_RemoteDirectoryProvider()).default();
}

function createRemoteDirectorySearcher() {
  return new (_RemoteDirectorySearcher || _load_RemoteDirectorySearcher()).default(dir => {
    const service = (0, (_nuclideRemoteConnection || _load_nuclideRemoteConnection()).getServiceByNuclideUri)('GrepService', dir.getPath());

    if (!service) {
      throw new Error('Invariant violation: "service"');
    }

    return service;
  });
}

function getHomeFragments() {
  return {
    feature: {
      title: 'Remote Connection',
      icon: 'cloud-upload',
      description: 'Connect to a remote server to edit files.',
      command: 'nuclide-remote-projects:connect'
    },
    priority: 8
  };
}