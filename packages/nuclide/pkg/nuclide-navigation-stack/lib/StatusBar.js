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
exports.consumeStatusBar = consumeStatusBar;

var _reactForAtom = require('react-for-atom');

var _atom = require('atom');

var _renderReactRoot;

function _load_renderReactRoot() {
  return _renderReactRoot = require('../../commons-atom/renderReactRoot');
}

var _Button;

function _load_Button() {
  return _Button = require('../../nuclide-ui/Button');
}

var _ButtonGroup;

function _load_ButtonGroup() {
  return _ButtonGroup = require('../../nuclide-ui/ButtonGroup');
}

var _bindObservableAsProps;

function _load_bindObservableAsProps() {
  return _bindObservableAsProps = require('../../nuclide-ui/bindObservableAsProps');
}

// Since this is a button which can change the current file, place it where
// it won't change position when the current file name changes, which means way left.
const STATUS_BAR_PRIORITY = -100;

function consumeStatusBar(statusBar, controller) {
  const onBack = () => controller.navigateBackwards();
  const onForward = () => controller.navigateForwards();
  const props = controller.observeStackChanges().map(stack => ({
    enableBack: stack.hasPrevious(),
    enableForward: stack.hasNext(),
    onBack: onBack,
    onForward: onForward
  }));
  const Tile = (0, (_bindObservableAsProps || _load_bindObservableAsProps()).bindObservableAsProps)(props, NavStackStatusBarTile);
  const item = (0, (_renderReactRoot || _load_renderReactRoot()).renderReactRoot)(_reactForAtom.React.createElement(Tile, null));
  item.className = 'nuclide-navigation-stack-tile inline-block';

  const statusBarTile = statusBar.addLeftTile({
    item: item,
    priority: STATUS_BAR_PRIORITY
  });

  return new _atom.Disposable(() => {
    statusBarTile.destroy();
  });
}

function NavStackStatusBarTile(props) {
  return _reactForAtom.React.createElement(
    (_ButtonGroup || _load_ButtonGroup()).ButtonGroup,
    null,
    _reactForAtom.React.createElement((_Button || _load_Button()).Button, {
      icon: 'chevron-left',
      onClick: props.onBack,
      disabled: !props.enableBack,
      title: 'Navigate Backwards'
    }),
    _reactForAtom.React.createElement((_Button || _load_Button()).Button, {
      icon: 'chevron-right',
      onClick: props.onForward,
      disabled: !props.enableForward,
      title: 'Navigate Forwards'
    })
  );
}