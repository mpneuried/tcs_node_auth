(function() {
  var Auth, bcrypt, utils, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ = require("lodash")._;

  bcrypt = require("bcrypt");

  utils = require("./utils");

  module.exports = Auth = (function(_super) {
    __extends(Auth, _super);

    Auth.prototype.defaults = function() {
      return this.extend(true, Auth.__super__.defaults.apply(this, arguments), {
        bryptrounds: 8,
        tokentimeout: 604800,
        defaultsendermail: null,
        mailAppId: null,
        mailConfig: {}
      });
    };

    function Auth(userstore, options) {
      this.userstore = userstore;
      this.ERRORS = __bind(this.ERRORS, this);
      this._delayError = __bind(this._delayError, this);
      this._validateUserStore = __bind(this._validateUserStore, this);
      this.login = __bind(this.login, this);
      this.defaults = __bind(this.defaults, this);
      Auth.__super__.constructor.call(this, options);
      this._validateUserStore();
      return;
    }

    Auth.prototype.login = function(email, password, cb) {
      var _this = this;
      if (!(email != null ? email.length : void 0)) {
        this._handleError(cb, "ELOGINMISSINGMAIL");
        return;
      }
      if (!(password != null ? password.length : void 0)) {
        this._handleError(cb, "ELOGINMISSINGPASSWORD");
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
          _this.debug("chackpw", dbPassword, err, same);
          if (err) {
            _this.warning("login", err);
            _this._delayError(cb, "ELOGINFAILED");
            return;
          }
          if (same) {
            cb(null, userData);
          } else {
            _this._delayError(cb, "ELOGINFAILED");
          }
        });
      });
    };

    Auth.prototype._validateUserStore = function() {
      var method, methods, _i, _len;
      methods = ["getUserCredentials", "checkUserEmail", "setUserCredentials", "getActivationMail"];
      for (_i = 0, _len = methods.length; _i < _len; _i++) {
        method = methods[_i];
        if (!((this.userstore[method] == null) || !_.isFunction(this.userstore[method]))) {
          continue;
        }
        this._handleError(null, "EMISSINGUSTOREMETHOD", {
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
        "EMISSINGUSTOREMETHOD": "Missing method `<%= method %>` in UserStore",
        "ELOGINMISSINGMAIL": "To invoke a `login` you have to define the first argument with a email.",
        "ELOGINMISSINGPASSWORD": "To invoke a `login` you have to define the second argument with a password.",
        "EUSTOREMISSINGPASSWORD": "Found user with the email \"<%= email %>\", but it has no password saved."
      });
    };

    return Auth;

  })(require("./basic"));

}).call(this);
