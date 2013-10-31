(function() {
  var TokenStore, crypto, utils,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  utils = require("./utils");

  crypto = require("./crypto");

  module.exports = TokenStore = (function(_super) {
    __extends(TokenStore, _super);

    TokenStore.prototype.defaults = function() {
      return this.extend(true, {}, TokenStore.__super__.defaults.apply(this, arguments), {
        namespace: "tcsnodeauth",
        tokenAlgorithm: "des3",
        tokenPwKey: "TOKENCIPHER",
        tokentimeout: 604800,
        maxUserTokens: 5
      });
    };

    function TokenStore(redis, options) {
      var _this = this;
      this.redis = redis;
      this.ERRORS = __bind(this.ERRORS, this);
      this.getTokenPw = __bind(this.getTokenPw, this);
      this._tRedisKey = __bind(this._tRedisKey, this);
      this._remove = __bind(this._remove, this);
      this._create = __bind(this._create, this);
      this._getByMail = __bind(this._getByMail, this);
      this._getByToken = __bind(this._getByToken, this);
      this.decrypt = __bind(this.decrypt, this);
      this.crypt = __bind(this.crypt, this);
      this.defaults = __bind(this.defaults, this);
      TokenStore.__super__.constructor.call(this, options);
      this.crypto = crypto(this.config.tokenAlgorithm);
      this.getByToken = this._waitUntilReady(this._getByToken);
      this.getByMail = this._waitUntilReady(this._getByMail);
      this.create = this._waitUntilReady(this._create);
      this.remove = this._waitUntilReady(this._remove);
      this.ready = false;
      this.getTokenPw(function(err, tknpw) {
        _this.debug("got token password", tknpw);
        _this.tknpw = tknpw;
        _this.ready = true;
        _this.emit("ready");
      });
      return;
    }

    TokenStore.prototype.crypt = function(data) {
      var _crypted;
      _crypted = this.crypto.crypt(this.tknpw, JSON.stringify(data));
      this.debug("crypted", _crypted);
      return _crypted;
    };

    TokenStore.prototype.decrypt = function(token) {
      var _str;
      _str = this.crypto.decrypt(this.tknpw, token);
      this.debug("decrypted", _str);
      return JSON.parse(_str);
    };

    TokenStore.prototype._getByToken = function(token, cb) {
      var _data, _err, _key,
        _this = this;
      try {
        _data = this.decrypt(token);
      } catch (_error) {
        _err = _error;
        this._handleError(cb, "ETOKENNOTFOUND");
        return;
      }
      _key = this._tRedisKey(_data.email);
      this.redis.lrange(_key, 0, -1, function(err, tokens) {
        if (err) {
          cb(err);
          return;
        }
        _this.debug("found tokens", tokens);
        if (__indexOf.call(tokens, token) >= 0) {
          cb(null, _data);
        } else {
          _this._handleError(cb, "ETOKENNOTFOUND");
        }
      });
    };

    TokenStore.prototype._getByMail = function(mail, cb) {
      var _key,
        _this = this;
      _key = this._tRedisKey(mail);
      this.redis.lindex(_key, 0, function(err, token) {
        var _data, _err;
        if (err) {
          cb(err);
          return;
        }
        _this.debug("token by mail", tokens);
        try {
          _data = _this.decrypt(token);
        } catch (_error) {
          _err = _error;
          _this._handleError(cb, "ETOKENNOTFOUND");
          return;
        }
        cb(null, _data);
      });
    };

    TokenStore.prototype._create = function(type, mail, newemail, cb) {
      var rM, _cryptData, _key, _token,
        _this = this;
      _cryptData = {
        type: type,
        email: mail,
        time: Date.now()
      };
      if (type === "changemail" && (newemail != null)) {
        _cryptData.newemail = newemail;
      }
      _token = this.crypt(_cryptData);
      _key = this._tRedisKey(mail);
      rM = [];
      rM.push(["LPUSH", _key, _token]);
      rM.push(["LTRIM", _key, 0, this.config.maxUserTokens - 1]);
      rM.push(["EXPIRE", _key, this.config.tokentimeout]);
      this.redis.multi(rM).exec(function(err, results) {
        var expsuccess, tokencount, trimsuccess;
        if (err) {
          cb(err);
          return;
        }
        tokencount = results[0], trimsuccess = results[1], expsuccess = results[2];
        _this.emit("token:count", mail, tokencount);
        _this.debug("created token", _token, mail, tokencount);
        cb(null, _token);
      });
    };

    TokenStore.prototype._remove = function(mail, cb) {
      var _key,
        _this = this;
      _key = this._tRedisKey(mail);
      this.redis.del(_key, function(err, success) {
        if (err) {
          cb(err);
          return;
        }
        cb(null);
      });
    };

    TokenStore.prototype._tRedisKey = function(mail) {
      return this.config.namespace + ":MAILS:" + mail;
    };

    TokenStore.prototype.getTokenPw = function(cb) {
      var _key,
        _this = this;
      _key = this.config.namespace + ":" + this.config.tokenPwKey;
      this.redis.get(_key, function(err, tknpw) {
        if (err) {
          cb(err);
          return;
        }
        if (tknpw != null ? tknpw.length : void 0) {
          cb(null, tknpw);
        } else {
          tknpw = utils.randomString(15, 1);
          _this.redis.set(_key, tknpw, function(err) {
            if (err) {
              cb(err);
              return;
            }
            cb(null, tknpw);
          });
        }
      });
    };

    TokenStore.prototype.ERRORS = function() {
      return this.extend(TokenStore.__super__.ERRORS.apply(this, arguments), {
        "ETOKENNOTFOUND": "The token is not valid"
      });
    };

    return TokenStore;

  })(require("./basic"));

}).call(this);
