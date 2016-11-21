'use strict';
/* @noflow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

/* NON-TRANSPILED FILE */
/* eslint comma-dangle: [1, always-multiline], prefer-object-spread/prefer-object-spread: 0 */

/**
 * This is the main insertion point for starting nuclide-server.
 */

// Set up the on-the-fly transpiler.
require('../../nuclide-node-transpiler');

// Load the ES6+ server code now that the transpiler is in place.
require('./main');
