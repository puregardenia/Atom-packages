# [esformatter](https://github.com/millermedeiros/esformatter)-shebang-ignore
> esformatter plugin: ignore shebang line so the rest of the javascript code could be formatted without parsing errors

[![NPM Version](http://img.shields.io/npm/v/esformatter-shebang-ignore.svg?style=flat)](https://npmjs.org/package/esformatter-shebang-ignore)
[![Build Status](http://img.shields.io/travis/royriojas/esformatter-shebang-ignore.svg?style=flat)](https://travis-ci.org/royriojas/esformatter-shebang-ignore)

**Esformatter-shebang-ignore** is a plugin for [esformatter](https://github.com/millermedeiros/esformatter) meant to allow the
code formatting of files that contain a shebang line. This plugin basically will make esformatter to ignore the offending shebang line and let `esformatter` apply the magic on the rest of the file.

So this plugin will turn this:
```js

#!/usr/bin/env node

var fs = require(         'fs' );
var utils = require    (    './lib/util' );
var path = require   ( 'path');
```

into:
```js
#!/usr/bin/env node

var fs = require( 'fs' );
var utils = require( './lib/util' );
var path = require( 'path' );
```

## Installation

```sh
$ npm install esformatter-shebang-ignore --save-dev
```

## Config

Newest esformatter versions autoload plugins from your `node_modules` [See this](https://github.com/millermedeiros/esformatter#plugins)

Add to your esformatter config file:

In order for this to work, this plugin should be the first one! (I Know too picky, but who isn't).

```json
{
  "plugins": [
    "esformatter-shebang-ignore"
  ]
}
```
**Note**: The previous syntax won't work because of [this issue](https://github.com/millermedeiros/esformatter/issues/245). 
But registering it manually will work like a charm!

Or you can manually register your plugin:
```js
// register plugin
esformatter.register(require('esformatter-shebang-ignore'));
```

## Usage

```js
var fs = require('fs');
var esformatter = require('esformatter');
//register plugin manually
esformatter.register(require('esformatter-shebang-ignore'));

var str = fs.readFileSync('someKewlFile.js').toString();
var output = esformatter.format(str);
//-> output will now contain the formatted code, allowing to format files with shebang lines
```

See [esformatter](https://github.com/millermedeiros/esformatter) for more options and further usage.

## License

MIT @[Roy Riojas](http://royriojas.com)