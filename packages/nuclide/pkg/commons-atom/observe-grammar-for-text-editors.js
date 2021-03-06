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
exports.default = observeGrammarForTextEditors;

var _atom = require('atom');

const GRAMMAR_CHANGE_EVENT = 'grammar-change';

/**
 * A singleton that listens to grammar changes in all text editors.
 */
let GrammarForTextEditorsListener = class GrammarForTextEditorsListener {

  constructor() {
    this._emitter = new _atom.Emitter();
    this._subscriptions = new _atom.CompositeDisposable();
    this._subscriptions.add(this._emitter, atom.workspace.observeTextEditors(textEditor => {
      const grammarSubscription = textEditor.observeGrammar(grammar => {
        this._emitter.emit(GRAMMAR_CHANGE_EVENT, textEditor);
      });
      const destroySubscription = textEditor.onDidDestroy(() => {
        grammarSubscription.dispose();
        destroySubscription.dispose();
      });
      this._subscriptions.add(grammarSubscription, destroySubscription);
    }));
  }

  observeGrammarForTextEditors(fn) {
    function fnWithGrammar(textEditor) {
      fn(textEditor, textEditor.getGrammar());
    }

    // The event was already handled before `fn` was added to the emitter, so
    // we need to call it on all the existing editors.
    atom.workspace.getTextEditors().forEach(fnWithGrammar);
    return this._emitter.on(GRAMMAR_CHANGE_EVENT, fnWithGrammar);
  }

  dispose() {
    this._subscriptions.dispose();
  }
};


let grammarForTextEditorsListener;

/**
 * Use this to perform an action on every text editor with its latest grammar.
 *
 * @param fn This is called once for every text editor, and then again every
 * time it changes to a grammar.
 */
function observeGrammarForTextEditors(fn) {
  if (!grammarForTextEditorsListener) {
    grammarForTextEditorsListener = new GrammarForTextEditorsListener();
  }
  return grammarForTextEditorsListener.observeGrammarForTextEditors(fn);
}

if (atom.inSpecMode()) {
  observeGrammarForTextEditors.__reset__ = function () {
    if (grammarForTextEditorsListener) {
      grammarForTextEditorsListener.dispose();
      grammarForTextEditorsListener = null;
    }
  };
}
module.exports = exports['default'];