(function() {
  var DefektUserStore, DummyDB, DummyUserStore, NotFunctionUserStore, _, _ref, _ref1, _ref2,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ = require("lodash")._;

  DummyDB = (function() {
    function DummyDB(coll) {
      this.coll = coll;
      this.update = __bind(this.update, this);
      this.get = __bind(this.get, this);
      this.create = __bind(this.create, this);
      this.filter = __bind(this.filter, this);
      this.has = __bind(this.has, this);
      return;
    }

    DummyDB.prototype.has = function(query, cb) {
      if (_.some(this.coll, query)) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    };

    DummyDB.prototype.filter = function(query, cb) {
      var _result;
      _result = _.filter(this.coll, query);
      cb(null, _result);
    };

    DummyDB.prototype.create = function(data, cb) {
      var newID;
      newID = _.max(this.coll, "id").id + 1;
      data.id = newID;
      this.coll.push(data);
      cb(null, data);
    };

    DummyDB.prototype.get = function() {
      var args, cb, crit, key, _i, _query,
        _this = this;
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
      crit = args[0], key = args[1];
      _query = {};
      _query[key || "id"] = crit;
      this.filter(_query, function(err, users) {
        if (!(users != null ? users.length : void 0)) {
          cb(new Error("not-found"));
          return;
        }
        cb(null, users[0]);
      });
    };

    DummyDB.prototype.update = function(id, data, cb) {
      var _this = this;
      this.get(id, function(err, user) {
        if (err) {
          cb(err);
          return;
        }
        cb(null, _.extend(user, data));
      });
    };

    return DummyDB;

  })();

  DefektUserStore = (function(_super) {
    __extends(DefektUserStore, _super);

    function DefektUserStore() {
      this.setUserMail = __bind(this.setUserMail, this);
      this.setUserCredentials = __bind(this.setUserCredentials, this);
      this.checkUserEmail = __bind(this.checkUserEmail, this);
      this.getUserCredentials = __bind(this.getUserCredentials, this);
      _ref = DefektUserStore.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    DefektUserStore.prototype.getUserCredentials = function(email, cb) {
      var _this = this;
      this.filter({
        email: email
      }, function(err, users) {
        if (!(users != null ? users.length : void 0)) {
          cb(new Error("not-found"));
          return;
        }
        cb(err, users[0].password, users[0]);
      });
    };

    DefektUserStore.prototype.checkUserEmail = function(email, options, cb) {
      this.has({
        email: email
      }, cb);
    };

    DefektUserStore.prototype.setUserCredentials = function(email, passwordcypt, isRegister, cb) {
      var _user,
        _this = this;
      _user = {
        name: null,
        email: email,
        password: passwordcypt
      };
      this.get(email, "email", function(err, user) {
        if (err && (err != null ? err.name : void 0) === "not-found") {
          cb(err);
        }
        if (user != null) {
          return _this.update(user.id, {
            password: passwordcypt
          }, function(err, dbUser) {
            if (err) {
              cb(err);
              return;
            }
            cb(null, dbUser);
          });
        } else {
          _this.create(_user, function(err, dbUser) {
            if (err) {
              cb(err);
              return;
            }
            cb(null, dbUser);
          });
        }
      });
    };

    DefektUserStore.prototype.setUserMail = function(current_email, new_email, cb) {
      var _this = this;
      this.get(current_email, "email", function(err, user) {
        if (err) {
          cb(err);
          return;
        }
        _this.update(user.id, {
          email: new_email
        }, function(err, dbUser) {
          if (err) {
            cb(err);
            return;
          }
          cb(null, dbUser);
        });
      });
    };

    return DefektUserStore;

  })(DummyDB);

  DummyUserStore = (function(_super) {
    __extends(DummyUserStore, _super);

    function DummyUserStore() {
      this.getMailContent = __bind(this.getMailContent, this);
      _ref1 = DummyUserStore.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    DummyUserStore.prototype.getMailContent = function(type, tokenOrNewmail, options, cb) {
      var mailData;
      switch (type) {
        case "register":
          mailData = {
            subject: "Test activation"
          };
          break;
        case "forgot":
          mailData = {
            subject: "Test password forgot"
          };
          break;
        case "changemail":
          mailData = {
            subject: "Test change mail"
          };
          break;
        case "notifyoldmail":
          mailData = {
            subject: "Test notify old mail"
          };
      }
      if (type === "notifyoldmail") {
        mailData.body = "Your mail has changed to `" + tokenOrNewmail + "`.";
      } else if ((options != null ? options.testMissingLink : void 0) != null) {
        mailData.body = "Body without token should cause an error.";
      } else {
        mailData.body = "Follow http://www.test.com/" + tokenOrNewmail + " to set your password.";
      }
      cb(null, mailData);
    };

    return DummyUserStore;

  })(DefektUserStore);

  NotFunctionUserStore = (function(_super) {
    __extends(NotFunctionUserStore, _super);

    function NotFunctionUserStore() {
      _ref2 = NotFunctionUserStore.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    NotFunctionUserStore.prototype.getActivationMail = 123;

    return NotFunctionUserStore;

  })(DefektUserStore);

  module.exports = {
    main: new DummyUserStore(require("./dummydata")),
    notfunction: new NotFunctionUserStore(require("./dummydata")),
    missingmethod: new DefektUserStore(require("./dummydata"))
  };

}).call(this);
