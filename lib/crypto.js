(function() {
  var crypto;

  crypto = require("crypto");

  module.exports = function(algorithm, enc_in, enc_out, padding) {
    var _ret;
    if (algorithm == null) {
      algorithm = "aes128";
    }
    if (enc_in == null) {
      enc_in = "utf8";
    }
    if (enc_out == null) {
      enc_out = "hex";
    }
    if (padding == null) {
      padding = true;
    }
    _ret = {
      crypt: function(key, str) {
        var cipher, _cipher;
        cipher = crypto.createCipher(algorithm, new Buffer(key));
        cipher.setAutoPadding(padding);
        _cipher = cipher.update(str, enc_in, enc_out);
        _cipher += cipher.final(enc_out);
        return _cipher;
      },
      decrypt: function(key, crypted) {
        var decipher, _decipher;
        decipher = crypto.createDecipher(algorithm, new Buffer(key));
        decipher.setAutoPadding(padding);
        _decipher = decipher.update(crypted, enc_out, enc_in);
        _decipher += decipher.final(enc_in);
        return _decipher;
      }
    };
    return _ret;
  };

}).call(this);
