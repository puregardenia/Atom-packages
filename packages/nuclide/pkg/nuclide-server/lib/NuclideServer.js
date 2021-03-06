'use strict';
'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _asyncToGenerator = _interopRequireDefault(require('async-to-generator'));

var _blocked;

function _load_blocked() {
  return _blocked = _interopRequireDefault(require('./blocked'));
}

var _config;

function _load_config() {
  return _config = require('./config');
}

var _utils;

function _load_utils() {
  return _utils = require('./utils');
}

var _nuclideVersion;

function _load_nuclideVersion() {
  return _nuclideVersion = require('../../nuclide-version');
}

var _nuclideLogging;

function _load_nuclideLogging() {
  return _nuclideLogging = require('../../nuclide-logging');
}

var _ws;

function _load_ws() {
  return _ws = _interopRequireDefault(require('ws'));
}

var _nuclideRpc;

function _load_nuclideRpc() {
  return _nuclideRpc = require('../../nuclide-rpc');
}

var _QueuedTransport;

function _load_QueuedTransport() {
  return _QueuedTransport = require('./QueuedTransport');
}

var _WebSocketTransport;

function _load_WebSocketTransport() {
  return _WebSocketTransport = require('./WebSocketTransport');
}

var _event;

function _load_event() {
  return _event = require('../../commons-node/event');
}

var _nuclideMarshalersCommon;

function _load_nuclideMarshalersCommon() {
  return _nuclideMarshalersCommon = require('../../nuclide-marshalers-common');
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const connect = require('connect');
const http = require('http');
const https = require('https');

const logger = (0, (_nuclideLogging || _load_nuclideLogging()).getLogger)();

let NuclideServer = class NuclideServer {

  constructor(options, services) {
    if (!(NuclideServer._theServer == null)) {
      throw new Error('Invariant violation: "NuclideServer._theServer == null"');
    }

    NuclideServer._theServer = this;

    const serverKey = options.serverKey,
          serverCertificate = options.serverCertificate,
          port = options.port,
          certificateAuthorityCertificate = options.certificateAuthorityCertificate,
          trackEventLoop = options.trackEventLoop;


    this._version = (0, (_nuclideVersion || _load_nuclideVersion()).getVersion)().toString();
    this._app = connect();
    this._attachUtilHandlers();
    if (serverKey && serverCertificate && certificateAuthorityCertificate) {
      const webServerOptions = {
        key: serverKey,
        cert: serverCertificate,
        ca: certificateAuthorityCertificate,
        requestCert: true,
        rejectUnauthorized: true
      };

      this._webServer = https.createServer(webServerOptions, this._app);
    } else {
      this._webServer = http.createServer(this._app);
    }
    this._port = port;

    this._webSocketServer = this._createWebSocketServer();
    this._clients = new Map();

    this._setupServices(); // Setup 1.0 and 2.0 services.

    if (trackEventLoop) {
      (0, (_blocked || _load_blocked()).default)(ms => {
        logger.info('NuclideServer event loop blocked for ' + ms + 'ms');
      });
    }

    this._rpcServiceRegistry = new (_nuclideRpc || _load_nuclideRpc()).ServiceRegistry((_nuclideMarshalersCommon || _load_nuclideMarshalersCommon()).getServerSideMarshalers, services);
  }

  _attachUtilHandlers() {
    // Add specific method handlers.
    ['get', 'post', 'delete', 'put'].forEach(methodName => {
      // $FlowFixMe - Use map instead of computed property on library type.
      this._app[methodName] = (uri, handler) => {
        this._app.use(uri, (request, response, next) => {
          if (request.method.toUpperCase() !== methodName.toUpperCase()) {
            // skip if method doesn't match.
            return next();
          } else {
            handler(request, response, next);
          }
        });
      };
    });
  }

  _createWebSocketServer() {
    const webSocketServer = new (_ws || _load_ws()).default.Server({ server: this._webServer });
    webSocketServer.on('connection', socket => this._onConnection(socket));
    webSocketServer.on('error', error => logger.error('WebSocketServer Error:', error));
    return webSocketServer;
  }

  _setupServices() {
    // Lazy require these functions so that we could spyOn them while testing in
    // ServiceIntegrationTestHelper.
    this._xhrServiceRegistry = {};
    this._setupHeartbeatHandler();

    // Setup error handler.
    this._app.use((error, request, response, next) => {
      if (error != null) {
        (0, (_utils || _load_utils()).sendJsonResponse)(response, { code: error.code, message: error.message }, 500);
      } else {
        next();
      }
    });
  }

  _setupHeartbeatHandler() {
    var _this = this;

    this._registerService('/' + (_config || _load_config()).HEARTBEAT_CHANNEL, (0, _asyncToGenerator.default)(function* () {
      return _this._version;
    }), 'post', true);
  }

  static shutdown() {
    logger.info('Shutting down the server');
    try {
      if (NuclideServer._theServer != null) {
        NuclideServer._theServer.close();
      }
    } catch (e) {
      logger.error('Error while shutting down, but proceeding anyway:', e);
    } finally {
      (0, (_nuclideLogging || _load_nuclideLogging()).flushLogsAndExit)(0);
    }
  }

  static closeConnection(client) {
    logger.info(`Closing client: #${ client.getTransport().id }`);
    if (NuclideServer._theServer != null) {
      NuclideServer._theServer._closeConnection(client);
    }
  }

  _closeConnection(client) {
    if (this._clients.get(client.getTransport().id) === client) {
      this._clients.delete(client.getTransport().id);
      client.dispose();
    }
  }

  connect() {
    return new Promise((resolve, reject) => {
      this._webServer.on('listening', () => {
        resolve();
      });
      this._webServer.on('error', e => {
        this._webServer.removeAllListeners();
        reject(e);
      });
      this._webServer.listen(this._port);
    });
  }

  /**
   * Calls a registered service with a name and arguments.
   */
  callService(serviceName, args) {
    const serviceFunction = this._xhrServiceRegistry[serviceName];
    if (!serviceFunction) {
      throw Error('No service registered with name: ' + serviceName);
    }
    return serviceFunction.apply(this, args);
  }

  /**
   * Registers a service function to a service name.
   * This allows simple future calls of the service by name and arguments or http-triggered
   * endpoint calls with arguments serialized over http.
   */
  _registerService(serviceName, serviceFunction, method, isTextResponse) {
    if (this._xhrServiceRegistry[serviceName]) {
      throw new Error('A service with this name is already registered:', serviceName);
    }
    this._xhrServiceRegistry[serviceName] = serviceFunction;
    this._registerHttpService(serviceName, method, isTextResponse);
  }

  _registerHttpService(serviceName, method, isTextResponse) {
    var _this2 = this;

    const loweredCaseMethod = method.toLowerCase();
    // $FlowFixMe - Use map instead of computed property.
    this._app[loweredCaseMethod](serviceName, (() => {
      var _ref2 = (0, _asyncToGenerator.default)(function* (request, response, next) {
        try {
          const result = yield _this2.callService(serviceName, (0, (_utils || _load_utils()).deserializeArgs)(request.url));
          if (isTextResponse) {
            (0, (_utils || _load_utils()).sendTextResponse)(response, result || '');
          } else {
            (0, (_utils || _load_utils()).sendJsonResponse)(response, result);
          }
        } catch (e) {
          // Delegate to the registered connect error handler.
          next(e);
        }
      });

      return function (_x, _x2, _x3) {
        return _ref2.apply(this, arguments);
      };
    })());
  }

  _onConnection(socket) {
    logger.debug('WebSocket connecting');

    let client = null;

    const errorSubscription = (0, (_event || _load_event()).attachEvent)(socket, 'error', e => logger.error('WebSocket error before first message', e));

    socket.once('message', clientId => {
      errorSubscription.dispose();
      client = this._clients.get(clientId);
      const transport = new (_WebSocketTransport || _load_WebSocketTransport()).WebSocketTransport(clientId, socket);
      if (client == null) {
        client = (_nuclideRpc || _load_nuclideRpc()).RpcConnection.createServer(this._rpcServiceRegistry, new (_QueuedTransport || _load_QueuedTransport()).QueuedTransport(clientId, transport));
        this._clients.set(clientId, client);
      } else {
        if (!(clientId === client.getTransport().id)) {
          throw new Error('Invariant violation: "clientId === client.getTransport().id"');
        }

        client.getTransport().reconnect(transport);
      }
    });
  }

  close() {
    if (!(NuclideServer._theServer === this)) {
      throw new Error('Invariant violation: "NuclideServer._theServer === this"');
    }

    NuclideServer._theServer = null;

    this._webSocketServer.close();
    this._webServer.close();
  }
};


module.exports = NuclideServer;