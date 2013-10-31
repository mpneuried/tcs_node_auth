(function() {
  exports.version = '0.1.0';

  exports.utils = require('./lib/utils');

  exports.crypto = require('./lib/crypto');

  exports.Mailer = require('./lib/mailer');

  exports.TokenStore = require('./lib/tokens');

  module.exports = require('./lib/auth');

}).call(this);
