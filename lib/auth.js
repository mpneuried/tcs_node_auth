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
      return this.extend(true, {}, Auth.__super__.defaults.apply(this, arguments), {
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
      this._changeMail = __bind(this._changeMail, this);
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
      this.changeMail = this._waitUntilReady(this._changeMail);
      this.getToken = this._waitUntilReady(this._getToken);
      this.activate = this._waitUntilReady(this._activate);
      this.initTokenStore = this._waitForConnection(this._initTokenStore);
      this.initTokenStore();
      this.mailer = new Mailer(this, _.omit(this.config, ["logging"]));
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
      this.tokenStore = new TokenStore(this.redis, _.omit(this.config, ["logging"]));
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

    Auth.prototype._activate = function() {
      var args, cb, options, password, token, _i,
        _this = this;
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
      token = args[0], password = args[1], options = args[2];
      if (!(token != null ? token.length : void 0)) {
        this._handleError(cb, "EMISSINGTOKEN", {
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
        _this.debug("got token", tokenData);
        if (tokenData.type === "changemail") {
          _this.userstore.setUserMail(tokenData.email, tokenData.newemail, function(err, userData) {
            if (err) {
              cb(err);
              return;
            }
            _this.debug("changed user mail `" + tokenData.email + "` to `" + tokenData.newemail + "` by token `" + token + "`");
            _this.userstore.getMailContent("notifyoldmail", tokenData.newemail, options, function(err, mailData) {
              if (err) {
                cb(err);
                return;
              }
              _this.emit("mail", tokenData.email, mailData, function(err) {
                if (err) {
                  cb(err);
                  return;
                }
                _this.debug("created token `" + token + "` of type `" + tokenData.type + "` for mail `" + tokenData.email + "`");
                cb(null, userData);
                _this.emit(tokenData.type, token, tokenData.email, tokenData.newemail);
              });
            });
          });
        } else {
          if (!(password != null ? password.length : void 0)) {
            _this._handleError(cb, "EMISSINGPASSWORD", {
              method: "activate"
            });
            return;
          }
          salt = bcrypt.genSaltSync(_this.config.bryptrounds);
          _cryptpassword = bcrypt.hashSync(password, salt);
          _this.userstore.setUserCredentials(tokenData.email, _cryptpassword, function(err, userData) {
            if (err) {
              cb(err);
              return;
            }
            _this.debug("created or updated user `" + tokenData.email + "` by token `" + token + "`");
            _this.tokenStore.remove(tokenData.email, function(err) {
              if (err) {
                cb(err);
                return;
              }
              _this.debug("activated mail `" + tokenData.email + "` with token `" + token + "`");
              cb(null, userData);
            });
          });
        }
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

    Auth.prototype._changeMail = function() {
      var args, cb, email, newemail, options, type, _i,
        _this = this;
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
      email = args[0], newemail = args[1], options = args[2];
      type = "changemail";
      if (!(email != null ? email.length : void 0)) {
        this._handleError(cb, "EMISSINGMAIL", {
          method: type
        });
        return;
      }
      if (!(newemail != null ? newemail.length : void 0)) {
        this._handleError(cb, "EMISSINGNEWMAIL", {
          method: type
        });
        return;
      }
      this.userstore.checkUserEmail(email, function(err, exists) {
        if (err) {
          _this._handleError(cb, err);
          return;
        } else if (!exists) {
          _this.warning("mail `" + email + "` not exists");
          _this._handleError(cb, "EMAILINVALID", {
            email: email
          });
          return;
        }
        _this.userstore.checkUserEmail(newemail, function(err, exists) {
          if (err) {
            _this._handleError(cb, err);
            return;
          } else if (exists) {
            _this.warning("mail `" + email + "` not exists");
            _this._handleError(cb, "ENEWMAILINVALID", {
              email: newemail
            });
            return;
          }
          _this.tokenStore.create(type, email, newemail, function(err, token) {
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
                _this.emit("mail", email, mailData, function(err) {
                  if (err) {
                    cb(err);
                    return;
                  }
                  _this.debug("created token `" + token + "` of type `" + type + "` for mail `" + email + "`");
                  cb(null);
                  _this.emit(type, token, email, newemail);
                });
              } else {
                _this._handleError(cb, "EUSTOREMAILTOKEN");
              }
            });
          });
        });
      });
    };

    Auth.prototype._create = function(type, email, options, cb) {
      var args, _i,
        _this = this;
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
      type = args[0], email = args[1], options = args[2];
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
        if (type === "register" && exists) {
          _this.warning("mail `" + email + "` exists");
          _this._handleError(cb, "EMAILINVALID", {
            email: email
          });
          return;
        } else if (type === "forgot" && !exists) {
          _this.warning("mail `" + email + "` not exists");
          _this._handleError(cb, "EMAILINVALID", {
            email: email
          });
          return;
        }
        _this.tokenStore.create(type, email, null, function(err, token) {
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
              _this.emit("mail", email, mailData, function(err) {
                _this.debug("created token `" + token + "` of type `" + type + "` for mail `" + email + "`");
                _this.emit(type, token, email);
                cb(null);
              });
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
        "EMISSINGNEWMAIL": "To invoke a `<%= method %>` you have to define the current and the new email.",
        "EMISSINGPASSWORD": "To invoke a `<%= method %>`you have to define the password argument.",
        "EMISSINGTOKEN": "To invoke a `<%= method %>`you have to define the token argument.",
        "EMAILINVALID": "The given mail `<%= email %>` is not allowed.",
        "ENEWMAILINVALID": "The given mail `<%= email %>` is allready existend.",
        "EUSTOREMISSINGMETHOD": "Missing method `<%= method %>` in UserStore",
        "EUSTOREMISSINGPASSWORD": "Found user with the email \"<%= email %>\", but it has no password saved.",
        "EUSTOREMAILTOKEN": "The token has has not been fount within the mail body"
      });
    };

    return Auth;

  })(require("./basic"));

}).call(this);
