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
exports.default = SettingsControl;

var _SettingsCheckbox;

function _load_SettingsCheckbox() {
  return _SettingsCheckbox = _interopRequireDefault(require('./SettingsCheckbox'));
}

var _SettingsInput;

function _load_SettingsInput() {
  return _SettingsInput = _interopRequireDefault(require('./SettingsInput'));
}

var _SettingsSelect;

function _load_SettingsSelect() {
  return _SettingsSelect = _interopRequireDefault(require('./SettingsSelect'));
}

var _reactForAtom = require('react-for-atom');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function SettingsControl(props) {
  const keyPath = props.keyPath,
        value = props.value,
        onChange = props.onChange,
        schema = props.schema;
  const description = schema.description,
        title = schema.title;


  if (schema) {
    if (schema.enum) {
      return _reactForAtom.React.createElement((_SettingsSelect || _load_SettingsSelect()).default, {
        description: description,
        keyPath: keyPath,
        onChange: onChange,
        title: title,
        value: value
      });
    } else if (schema.type === 'color') {
      if (!false) {
        throw new Error('Invariant violation: "false"');
      } // Not implemented.

    } else if (isBoolean(value) || schema.type === 'boolean') {
      return _reactForAtom.React.createElement((_SettingsCheckbox || _load_SettingsCheckbox()).default, {
        description: description,
        keyPath: keyPath,
        onChange: onChange,
        title: title,
        value: value
      });
    } else if (Array.isArray(value) || schema.type === 'array') {
      if (isEditableArray(value)) {
        return _reactForAtom.React.createElement((_SettingsInput || _load_SettingsInput()).default, {
          description: description,
          keyPath: keyPath,
          onChange: onChange,
          title: title,
          value: value,
          type: 'array'
        });
      }
    } else if (isObject(value) || schema.type === 'object') {
      if (!false) {
        throw new Error('Invariant violation: "false"');
      } // Not implemented.

    } else {
      const type = isNumber(value) ? 'number' : 'string';
      return _reactForAtom.React.createElement((_SettingsInput || _load_SettingsInput()).default, {
        description: description,
        keyPath: keyPath,
        onChange: onChange,
        title: title,
        value: value,
        type: type
      });
    }
  }

  return null;
}

function isBoolean(obj) {
  return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
}

function isNumber(obj) {
  return toString.call(obj) === '[object Number]';
}

function isObject(obj) {
  const type = typeof obj;
  return type === 'function' || type === 'object' && Boolean(obj);
}

function isEditableArray(array) {
  for (let i = 0, len = array.length; i < len; i++) {
    const item = array[i];
    if (typeof item !== 'string') {
      return false;
    }
  }
  return true;
}
module.exports = exports['default'];