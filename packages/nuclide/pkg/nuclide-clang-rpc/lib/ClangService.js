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
exports.formatCode = exports.getLocalReferences = exports.getOutline = exports.getDeclarationInfo = exports.getDeclaration = exports.getCompletions = exports.ClangCursorTypes = exports.ClangCursorToDeclarationTypes = undefined;

var _asyncToGenerator = _interopRequireDefault(require('async-to-generator'));

let getClangService = (() => {
  var _ref = (0, _asyncToGenerator.default)(function* (src, contents, defaultFlags, blocking) {
    const server = yield serverManager.getClangServer(src, contents, defaultFlags);
    if (server == null) {
      return null;
    }
    if (server.getStatus() !== (_ClangServer || _load_ClangServer()).default.Status.READY) {
      if (blocking) {
        yield server.waitForReady();
      } else {
        return null;
      }
    }
    return server.getService();
  });

  return function getClangService(_x, _x2, _x3, _x4) {
    return _ref.apply(this, arguments);
  };
})();

/**
 * Compiles the specified source file (automatically determining the correct compilation flags).
 * It currently returns an Observable just to circumvent the 60s service timeout for Promises.
 * TODO(9519963): Stream back more detailed compile status message.
 */


let getCompletions = exports.getCompletions = (() => {
  var _ref3 = (0, _asyncToGenerator.default)(function* (src, contents, line, column, tokenStartColumn, prefix, defaultFlags) {
    const service = yield getClangService(src, contents, defaultFlags);
    if (service != null) {
      return service.get_completions(contents, line, column, tokenStartColumn, prefix);
    }
  });

  return function getCompletions(_x5, _x6, _x7, _x8, _x9, _x10, _x11) {
    return _ref3.apply(this, arguments);
  };
})();

let getDeclaration = exports.getDeclaration = (() => {
  var _ref4 = (0, _asyncToGenerator.default)(function* (src, contents, line, column, defaultFlags) {
    const service = yield getClangService(src, contents, defaultFlags);
    if (service != null) {
      return service.get_declaration(contents, line, column);
    }
  });

  return function getDeclaration(_x12, _x13, _x14, _x15, _x16) {
    return _ref4.apply(this, arguments);
  };
})();

// Fetches information for a declaration and all its parents.
// The first element in info will be for the declaration itself,
// the second will be for its direct semantic parent (if it exists), etc.


let getDeclarationInfo = exports.getDeclarationInfo = (() => {
  var _ref5 = (0, _asyncToGenerator.default)(function* (src, contents, line, column, defaultFlags) {
    const service = yield getClangService(src, contents, defaultFlags);
    if (service != null) {
      return service.get_declaration_info(contents, line, column);
    }
  });

  return function getDeclarationInfo(_x17, _x18, _x19, _x20, _x21) {
    return _ref5.apply(this, arguments);
  };
})();

let getOutline = exports.getOutline = (() => {
  var _ref6 = (0, _asyncToGenerator.default)(function* (src, contents, defaultFlags) {
    const service = yield getClangService(src, contents, defaultFlags, true);
    if (service != null) {
      return service.get_outline(contents);
    }
  });

  return function getOutline(_x22, _x23, _x24) {
    return _ref6.apply(this, arguments);
  };
})();

let getLocalReferences = exports.getLocalReferences = (() => {
  var _ref7 = (0, _asyncToGenerator.default)(function* (src, contents, line, column, defaultFlags) {
    const service = yield getClangService(src, contents, defaultFlags, true);
    if (service != null) {
      return service.get_local_references(contents, line, column);
    }
  });

  return function getLocalReferences(_x25, _x26, _x27, _x28, _x29) {
    return _ref7.apply(this, arguments);
  };
})();

let formatCode = exports.formatCode = (() => {
  var _ref8 = (0, _asyncToGenerator.default)(function* (src, contents, cursor, offset, length) {
    const args = ['-style=file', `-assume-filename=${ src }`, `-cursor=${ cursor }`];
    if (offset != null) {
      args.push(`-offset=${ offset }`);
    }
    if (length != null) {
      args.push(`-length=${ length }`);
    }

    var _ref9 = yield (0, (_process || _load_process()).checkOutput)('clang-format', args, { stdin: contents });

    const stdout = _ref9.stdout;

    // The first line is a JSON blob indicating the new cursor position.

    const newLine = stdout.indexOf('\n');
    return {
      newCursor: JSON.parse(stdout.substring(0, newLine)).Cursor,
      formatted: stdout.substring(newLine + 1)
    };
  });

  return function formatCode(_x30, _x31, _x32, _x33, _x34) {
    return _ref8.apply(this, arguments);
  };
})();

/**
 * Kill the Clang server for a particular source file,
 * as well as all the cached compilation flags.
 * If no file is provided, all servers are reset.
 */


exports.compile = compile;
exports.reset = reset;
exports.dispose = dispose;

var _collection;

function _load_collection() {
  return _collection = require('../../commons-node/collection');
}

var _rxjsBundlesRxMinJs = require('rxjs/bundles/Rx.min.js');

var _process;

function _load_process() {
  return _process = require('../../commons-node/process');
}

var _ClangServer;

function _load_ClangServer() {
  return _ClangServer = _interopRequireDefault(require('./ClangServer'));
}

var _ClangServerManager;

function _load_ClangServerManager() {
  return _ClangServerManager = _interopRequireDefault(require('./ClangServerManager'));
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const serverManager = new (_ClangServerManager || _load_ClangServerManager()).default();

// Maps clang's cursor types to the actual declaration types: for a full list see
// https://github.com/llvm-mirror/clang/blob/master/include/clang/Basic/DeclNodes.td
//
// Keep in sync with the clang Python binding (../fb/lib/python/clang/cindex.py)
// The order of the keys matches the ordering in cindex.py.
const ClangCursorToDeclarationTypes = exports.ClangCursorToDeclarationTypes = Object.freeze({
  UNEXPOSED_DECL: '',
  STRUCT_DECL: 'Record',
  UNION_DECL: 'Record',
  CLASS_DECL: 'CXXRecord',
  ENUM_DECL: 'Enum',
  FIELD_DECL: 'Field',
  ENUM_CONSTANT_DECL: 'EnumConstant',
  FUNCTION_DECL: 'Function',
  VAR_DECL: 'Var',
  PARM_DECL: 'ParmVar',
  OBJC_INTERFACE_DECL: 'ObjCInterface',
  OBJC_CATEGORY_DECL: 'ObjCCategory',
  OBJC_PROTOCOL_DECL: 'ObjCProtocol',
  OBJC_PROPERTY_DECL: 'ObjCProperty',
  OBJC_IVAR_DECL: 'ObjCIVar',
  OBJC_INSTANCE_METHOD_DECL: 'ObjCMethod',
  OBJC_CLASS_METHOD_DECL: 'ObjCMethod',
  OBJC_IMPLEMENTATION_DECL: 'ObjCImplementation',
  OBJC_CATEGORY_IMPL_DECL: 'ObjCCategoryImpl',
  TYPEDEF_DECL: 'Typedef',
  CXX_METHOD: 'CXXMethod',
  NAMESPACE: 'Namespace',
  LINKAGE_SPEC: 'LinkageSpec',
  CONSTRUCTOR: 'CXXConstructor',
  DESTRUCTOR: 'CXXDestructor',
  CONVERSION_FUNCTION: 'CXXConversion',
  TEMPLATE_TYPE_PARAMETER: 'TemplateTypeParm',
  TEMPLATE_NON_TYPE_PARAMETER: 'NonTypeTemplateParm',
  TEMPLATE_TEMPLATE_PARAMETER: 'TemplateTemplateParm',
  FUNCTION_TEMPLATE: 'FunctionTemplate',
  CLASS_TEMPLATE: 'ClassTemplate',
  CLASS_TEMPLATE_PARTIAL_SPECIALIZATION: 'ClassTemplatePartialSpecialization',
  NAMESPACE_ALIAS: 'NamespaceAlias',
  USING_DIRECTIVE: 'UsingDirective',
  USING_DECLARATION: 'Using',
  TYPE_ALIAS_DECL: 'TypeAlias',
  OBJC_SYNTHESIZE_DECL: 'ObjCSynthesize',
  OBJC_DYNAMIC_DECL: 'ObjCDynamic',
  CXX_ACCESS_SPEC_DECL: 'AccessSpec',
  OVERLOAD_CANDIDATE: 'Function',
  MACRO_DEFINITION: 'Macro'
});

const ClangCursorTypes = exports.ClangCursorTypes = (0, (_collection || _load_collection()).keyMirror)(ClangCursorToDeclarationTypes);

function compile(src, contents, defaultFlags) {
  const doCompile = (() => {
    var _ref2 = (0, _asyncToGenerator.default)(function* () {
      // Note: restarts the server if the flags changed.
      const server = yield serverManager.getClangServer(src, contents, defaultFlags, true);
      if (server != null) {
        return server.compile(contents);
      }
    });

    return function doCompile() {
      return _ref2.apply(this, arguments);
    };
  })();
  return _rxjsBundlesRxMinJs.Observable.fromPromise(doCompile()).publish();
}

function reset(src) {
  serverManager.reset(src);
}

function dispose() {
  serverManager.dispose();
}