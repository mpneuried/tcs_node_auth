(function() {
  var DummyUserStore, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ = require("lodash")._;

  DummyUserStore;

  DummyUserStore = (function() {
    function DummyUserStore(coll) {
      this.coll = coll;
      this.create = __bind(this.create, this);
      this.filter = __bind(this.filter, this);
      this.has = __bind(this.has, this);
      this.getActivationMail = __bind(this.getActivationMail, this);
      this.setUserCredentials = __bind(this.setUserCredentials, this);
      this.checkUserEmail = __bind(this.checkUserEmail, this);
      this.getUserCredentials = __bind(this.getUserCredentials, this);
      return;
    }

    DummyUserStore.prototype.getUserCredentials = function(email, cb) {
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

    DummyUserStore.prototype.checkUserEmail = function(email, cb) {
      this.has({
        email: email
      }, cb);
    };

    DummyUserStore.prototype.setUserCredentials = function(email, passwordcypt, cb) {
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

    DummyUserStore.prototype.getActivationMail = function(token, options, cb) {
      var mailData;
      mailData = {
        subject: "Test activation"
      };
      if (options.testMissingLink != null) {
        mailData.body = "Body without token should cause an error.";
      } else {
        mailData.body = "Follow http://www.test.com/" + token + " to activate your account.";
      }
      cb(err, mailData);
    };

    DummyUserStore.prototype.has = function(query, cb) {
      if (_.some(this.coll, query)) {
        cb(null);
      } else {
        cb(new Error("not-found"));
      }
    };

    DummyUserStore.prototype.filter = function(query, cb) {
      var _result;
      _result = _.filter(this.coll, query);
      cb(null, _result);
    };

    DummyUserStore.prototype.create = function(data, cb) {
      var newID;
      newID = _.max(this.coll, "id").id + 1;
      data.id = newID;
      this.coll.push(data);
      cb(null, data);
    };

    return DummyUserStore;

  })();

  module.exports = new DummyUserStore(require("./dummydata"));

}).call(this);
