module.exports = {
  _firstLine: null,
  stringBefore: function (code) {
    var me = this;
    me._firstLine = code.match(/^(#!.+)\n/);

    if (me._firstLine && me._firstLine.length > 1) {
      code = code.replace(me._firstLine[1], "/*___SHE_BANG_HERE___*/");
    }

    return code;
  },
  stringAfter: function (code) {
    var me = this;
    if (me._firstLine) {
      code = code.replace(/\/\*___SHE_BANG_HERE___\*\//g, me._firstLine[1]);
    }
    me._firstLine = null;
    return code;
  }
};
