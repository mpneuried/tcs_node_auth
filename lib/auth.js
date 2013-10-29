(function() {
  var Auth, Mailer, RedisInst, TokenStore, bcrypt, utils, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  _ = require("lodash")._;

  bcrypt = require("bcrypt");

  RedisInst = require("redis");

  utils = require("./utils");

  TokenStore = require("./tokens");

  Mailer = require("./mailer");

  module.exports = Auth = (function(_super) {
    __extends(Auth, _super);

    Auth.prototype.defaults = function() {
      return this.extend(true, Auth.__super__.defaults.apply(this, arguments), {
        bryptrounds: 8,
        mailAppId: null,
        mailConfig: {},
        redis: null
      });
    };

    function Auth(userstore, options) {
      this.userstore = userstore;
      this.ERRORS = __bind(this.ERRORS, this);
      this._delayError = __bind(this._delayError, this);
      this._validateUserStore = __bind(this._validateUserStore, this);
      this._create = __bind(this._create, this);
      this._forgot = __bind(this._forgot, this);
      this._register = __bind(this._register, this);
      this._activate = __bind(this._activate, this);
      this._getToken = __bind(this._getToken, this);
      this._login = __bind(this._login, this);
      this._initTokenStore = __bind(this._initTokenStore, this);
      this._initRedis = __bind(this._initRedis, this);
      this._waitForConnection = __bind(this._waitForConnection, this);
      this.defaults = __bind(this.defaults, this);
      Auth.__super__.constructor.call(this, options);
      this._initRedis();
      this._validateUserStore();
      this.login = this._waitUntilReady(this._login);
      this.register = this._waitUntilReady(this._register);
      this.forgot = this._waitUntilReady(this._forgot);
      this.getToken = this._waitUntilReady(this._getToken);
      this.activate = this._waitUntilReady(this._activate);
      this.initTokenStore = this._waitForConnection(this._initTokenStore);
      this.initTokenStore();
      this.mailer = new Mailer(this, this.config);
      return;
    }

    Auth.prototype._waitForConnection = function(method) {
      var _this = this;
      return function() {
        var args;
        args = arguments;
        if (_this.connected) {
          method.apply(_this, args);
        } else {
          _this.once("connect", function() {
            method.apply(_this, args);
          });
        }
      };
    };

    Auth.prototype._initRedis = function() {
      var _ref, _ref1, _ref2, _ref3, _ref4,
        _this = this;
      if (((_ref = this.config.redis) != null ? (_ref1 = _ref.constructor) != null ? _ref1.name : void 0 : void 0) === "RedisClient") {
        this.redis = this.config.redis;
      } else {
        this.redis = RedisInst.createClient(((_ref2 = this.config.redis) != null ? _ref2.port : void 0) || 6379, ((_ref3 = this.config.redis) != null ? _ref3.host : void 0) || "127.0.0.1", ((_ref4 = this.config.redis) != null ? _ref4.options : void 0) || {});
      }
      this.connected = this.redis.connected || false;
      this.redis.on("connect", function() {
        _this.connected = true;
        _this.emit("connect");
      });
      this.redis.on("error", function(err) {
        if (err.message.indexOf("ECONNREFUSED")) {
          _this.connected = false;
          _this.emit("disconnect");
        } else {
          _this.error("Redis ERROR", err);
          _this.emit("error");
        }
      });
    };

    Auth.prototype._initTokenStore = function() {
      var _this = this;
      this.ready = false;
      this.tokenStore = new TokenStore(this.redis, this.config);
      this.tokenStore.on("ready", function() {
        _this.ready = true;
        _this.emit("ready");
      });
    };

    Auth.prototype._login = function(email, password, cb) {
      var _this = this;
      if (!(email != null ? email.length : void 0)) {
        this._handleError(cb, "EMISSINGMAIL", {
          method: "login"
        });
        return;
      }
      if (!(password != null ? password.length : void 0)) {
        this._handleError(cb, "EMISSINGPASSWORD", {
          method: "login"
        });
        return;
      }
      this.userstore.getUserCredentials(email, function(err, dbPassword, userData) {
        if (err) {
          _this.warning("EUSTORE", err);
          _this._delayError(cb, "ELOGINFAILED");
          return;
        }
        if (!(dbPassword != null ? dbPassword.length : void 0)) {
          _this.warning("EUSTOREMISSINGPASSWORD - " + _this._ERRORS["EUSTOREMISSINGPASSWORD"]({
            email: email
          }));
          _this._delayError(cb, "ELOGINFAILED");
          return;
        }
        bcrypt.compare(password, dbPassword, function(err, same) {
          _this.debug("check-pw", dbPassword, err, same);
          if (err) {
            _this.warning("login", err);
            _this._delayError(cb, "ELOGINFAILED");
            return;
          }
          if (same) {
            _this.emit("login", userData);
            cb(null, userData);
          } else {
            _this._delayError(cb, "ELOGINFAILED");
          }
        });
      });
    };

    Auth.prototype._getToken = function(token, cb) {
      if (!(token != null ? token.length : void 0)) {
        this._handleError(cb, "EMISSINGTOKEN", {
          method: "getToken"
        });
        return;
      }
      this.tokenStore._getByToken(token, cb);
    };

    Auth.prototype._activate = function(token, password, cb) {
      var _this = this;
      if (!(token != null ? token.length : void 0)) {
        this._handleError(cb, "EMISSINGTOKEN", {
          method: "activate"
        });
        return;
      }
      if (!(password != null ? password.length : void 0)) {
        this._handleError(cb, "EMISSINGPASSWORD", {
          method: "activate"
        });
        return;
      }
      this._getToken(token, function(err, tokenData) {
        var salt, _cryptpassword;
        if (err) {
          cb(err);
          return;
        }
        salt = bcrypt.genSaltSync(_this.config.bryptrounds);
        _cryptpassword = bcrypt.hashSync(password, salt);
        _this.userstore.setUserCredentials(tokenData.email, _cryptpassword, function(err, userData) {
          if (err) {
            cb(err);
            return;
          }
          _this.tokenStore.remove(tokenData.email, function(err) {
            if (err) {
              cb(err);
              return;
            }
            cb(null, userData);
          });
        });
      });
    };

    Auth.prototype._register = function() {
      var args, cb, email, options, _i;
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
      email = args[0], options = args[1];
      this._create("register", email, options, cb);
    };

    Auth.prototype._forgot = function() {
      var args, cb, email, options, _i;
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
      email = args[0], options = args[1];
      this._create("forgot", email, options, cb);
    };

    Auth.prototype._create = function(type, email, options, cb) {
      var _this = this;
      if (!(email != null ? email.length : void 0)) {
        this._handleError(cb, "EMISSINGMAIL", {
          method: type
        });
        return;
      }
      this.userstore.checkUserEmail(email, function(err, exists) {
        if (err) {
          _this._handleError(cb, err);
          return;
        }
        if (exists) {
          _this.warning("mail `" + email + "` exists");
          _this._handleError(cb, "EMAILNOTALLOWED", {
            email: email
          });
          return;
        }
        _this.tokenStore.create(type, email, function(err, token) {
          if (err) {
            cb(err);
            return;
          }
          _this.userstore.getMailContent(type, token, options, function(err, mailData) {
            var _ref;
            if (err) {
              cb(err);
              return;
            }
            if (((_ref = mailData.body) != null ? typeof _ref.indexOf === "function" ? _ref.indexOf(token) : void 0 : void 0) >= 0) {
              _this.emit("mail", email, mailData);
              cb(null);
              _this.emit(type, token, email);
            } else {
              _this._handleError(cb, "EUSTOREMAILTOKEN");
            }
          });
        });
      });
    };

    Auth.prototype._validateUserStore = function() {
      var method, methods, _i, _len;
      methods = ["getUserCredentials", "checkUserEmail", "setUserCredentials", "getMailContent"];
      for (_i = 0, _len = methods.length; _i < _len; _i++) {
        method = methods[_i];
        if (!((this.userstore[method] == null) || !_.isFunction(this.userstore[method]))) {
          continue;
        }
        this._handleError(null, "EUSTOREMISSINGMETHOD", {
          method: method
        });
        return;
      }
    };

    Auth.prototype._delayError = function() {
      var args, _delay, _tfnErr;
      _delay = utils.randRange(0, 200);
      args = [this._handleError, _delay].concat(Array.prototype.slice.call(arguments));
      _tfnErr = _.delay.apply(_, args);
    };

    Auth.prototype.ERRORS = function() {
      return this.extend(Auth.__super__.ERRORS.apply(this, arguments), {
        "ELOGINFAILED": "Login failed. Please check your credentials",
        "EMISSINGMAIL": "To invoke a `<%= method %>` you have to define the email argument.",
        "EMISSINGPASSWORD": "To invoke a `<%= method %>`you have to define the password argument.",
        "EMISSINGTOKEN": "To invoke a `<%= method %>`you have to define the token argument.",
        "EMAILNOTALLOWED": "The given mail `<%= mail %>` is not allowed.",
        "EUSTOREMISSINGMETHOD": "Missing method `<%= method %>` in UserStore",
        "EUSTOREMISSINGPASSWORD": "Found user with the email \"<%= email %>\", but it has no password saved.",
        "EUSTOREMAILTOKEN": "The token has has not been fount within the mail body"
      });
    };

    return Auth;

  })(require("./basic"));

}).call(this);
