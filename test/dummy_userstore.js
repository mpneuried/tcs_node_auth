(function() {
  var DefektUserStore, DummyDB, DummyUserStore, NotFunctionUserStore, _, _ref, _ref1, _ref2,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ = require("lodash")._;

  DummyDB = (function() {
    function DummyDB(coll) {
      this.coll = coll;
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

    return DummyDB;

  })();

  DefektUserStore = (function(_super) {
    __extends(DefektUserStore, _super);

    function DefektUserStore() {
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

    DefektUserStore.prototype.checkUserEmail = function(email, cb) {
      this.has({
        email: email
      }, cb);
    };

    DefektUserStore.prototype.setUserCredentials = function(email, passwordcypt, cb) {
      var _user,
        _this = this;
      _user = {
        name: null,
        email: email,
        password: passwordcypt
      };
      this.create(_user, function(err, dbUser) {
        if (err) {
          cb(err);
          return;
        }
        cb(dbUser);
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

    DummyUserStore.prototype.getMailContent = function(type, token, options, cb) {
      var mailData;
      switch (type) {
        case "register":
          mailData = {
            subject: "Test activation"
          };
          break;
        case "forgot":
          mailData = {
            subject: "Test activation"
          };
      }
      if ((options != null ? options.testMissingLink : void 0) != null) {
        mailData.body = "Body without token should cause an error.";
      } else {
        mailData.body = "Follow http://www.test.com/" + token + " to set your password.";
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
