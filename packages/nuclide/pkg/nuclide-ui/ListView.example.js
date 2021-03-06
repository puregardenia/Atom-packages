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
exports.ListviewExamples = undefined;

var _reactForAtom = require('react-for-atom');

var _Block;

function _load_Block() {
  return _Block = require('./Block');
}

var _ListView;

function _load_ListView() {
  return _ListView = require('./ListView');
}

var _Checkbox;

function _load_Checkbox() {
  return _Checkbox = require('./Checkbox');
}

var _MultiSelectList;

function _load_MultiSelectList() {
  return _MultiSelectList = require('./MultiSelectList');
}

const NOOP = () => {};

const ListviewExample1 = () => _reactForAtom.React.createElement(
  (_Block || _load_Block()).Block,
  null,
  _reactForAtom.React.createElement(
    (_ListView || _load_ListView()).ListView,
    { alternateBackground: true },
    _reactForAtom.React.createElement(
      (_ListView || _load_ListView()).ListViewItem,
      { value: { id: 1 } },
      'test1'
    ),
    _reactForAtom.React.createElement(
      (_ListView || _load_ListView()).ListViewItem,
      { value: { id: 2 } },
      'test2'
    ),
    _reactForAtom.React.createElement(
      (_ListView || _load_ListView()).ListViewItem,
      { value: { id: 3 } },
      'test3'
    ),
    _reactForAtom.React.createElement(
      (_ListView || _load_ListView()).ListViewItem,
      { value: { id: 4 } },
      'test4'
    ),
    _reactForAtom.React.createElement(
      (_ListView || _load_ListView()).ListViewItem,
      { value: { id: 5 } },
      'test5'
    )
  )
);
const ListviewExample2 = () => _reactForAtom.React.createElement(
  (_Block || _load_Block()).Block,
  null,
  _reactForAtom.React.createElement(
    (_ListView || _load_ListView()).ListView,
    { alternateBackground: true },
    _reactForAtom.React.createElement(
      (_ListView || _load_ListView()).ListViewItem,
      null,
      _reactForAtom.React.createElement((_Checkbox || _load_Checkbox()).Checkbox, {
        checked: true,
        onClick: NOOP,
        onChange: NOOP,
        label: 'A Checkbox.'
      })
    ),
    _reactForAtom.React.createElement(
      (_ListView || _load_ListView()).ListViewItem,
      null,
      _reactForAtom.React.createElement((_Checkbox || _load_Checkbox()).Checkbox, {
        checked: true,
        onClick: NOOP,
        onChange: NOOP,
        label: 'A Checkbox.'
      })
    ),
    _reactForAtom.React.createElement(
      (_ListView || _load_ListView()).ListViewItem,
      null,
      _reactForAtom.React.createElement((_Checkbox || _load_Checkbox()).Checkbox, {
        checked: true,
        onClick: NOOP,
        onChange: NOOP,
        label: 'A Checkbox.'
      })
    ),
    _reactForAtom.React.createElement(
      (_ListView || _load_ListView()).ListViewItem,
      null,
      _reactForAtom.React.createElement((_Checkbox || _load_Checkbox()).Checkbox, {
        checked: false,
        onClick: NOOP,
        onChange: NOOP,
        label: 'A Checkbox.'
      })
    ),
    _reactForAtom.React.createElement(
      (_ListView || _load_ListView()).ListViewItem,
      null,
      _reactForAtom.React.createElement((_Checkbox || _load_Checkbox()).Checkbox, {
        checked: false,
        onClick: NOOP,
        onChange: NOOP,
        label: 'A Checkbox.'
      })
    )
  )
);

let MultiSelectListExample = class MultiSelectListExample extends _reactForAtom.React.Component {
  constructor(props) {
    super(props);
    this.state = { value: [2] };
  }
  render() {
    const options = [{ value: 1, label: 'One' }, { value: 2, label: 'Two' }, { value: 3, label: 'Three' }, { value: 4, label: 'Four' }];

    return _reactForAtom.React.createElement((_MultiSelectList || _load_MultiSelectList()).MultiSelectList, {
      options: options,
      value: this.state.value,
      onChange: value => {
        this.setState({ value: value });
      }
    });
  }
};
const ListviewExamples = exports.ListviewExamples = {
  sectionName: 'ListView',
  description: '',
  examples: [{
    title: 'Simple ListView',
    component: ListviewExample1
  }, {
    title: 'Arbitrary components as list items',
    component: ListviewExample2
  }, {
    title: 'Multi-Select List',
    component: MultiSelectListExample
  }]
};