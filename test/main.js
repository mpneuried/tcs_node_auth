(function() {
  var DummyUserStores, TCSAuth, async, auth, config, should, _;

  should = require("should");

  async = require("async");

  _ = require("lodash")._;

  TCSAuth = require("../lib/auth");

  DummyUserStores = require("./dummy_userstore");

  auth = null;

  config = {
    mailAppId: "testing",
    mailConfig: {
      sendermail: "auth@example.com",
      simulate: true
    }
  };

  describe("=== MAIN TESTS === ", function() {
    describe("- Init -", function() {
      it("create auth app. UserStore with missing method.", function(done) {
        var _err;
        try {
          new TCSAuth(DummyUserStores.missingmethod, config);
          throw "Should fail";
        } catch (_error) {
          _err = _error;
          should.exist(_err);
          should.exist(_err.name);
          _err.name.should.equal("EMISSINGUSTOREMETHOD");
          done();
        }
      });
      it("create auth app. UserStore with method not a function.", function(done) {
        var _err;
        try {
          new TCSAuth(DummyUserStores.notfunction, config);
          throw "Should fail";
        } catch (_error) {
          _err = _error;
          should.exist(_err);
          should.exist(_err.name);
          _err.name.should.equal("EMISSINGUSTOREMETHOD");
          done();
        }
      });
      return it("create auth app", function(done) {
        auth = new TCSAuth(DummyUserStores.main, config);
        auth.should.be.an.instanceOf(TCSAuth);
        done();
      });
    });
    describe("- Login -", function() {
      it("login with missing empty `email`", function(done) {
        auth.login(null, "test", function(err, userData) {
          should.exist(err);
          should.exist(err.name);
          err.name.should.equal("ELOGINMISSINGMAIL");
          should.not.exist(userData);
          done();
        });
      });
      it("login with missing empty `passowrd`", function(done) {
        auth.login("cortezwaters@example.com", null, function(err, userData) {
          should.exist(err);
          should.exist(err.name);
          err.name.should.equal("ELOGINMISSINGPASSWORD");
          should.not.exist(userData);
          done();
        });
      });
      it("login with unkown `email`", function(done) {
        auth.login("unknown@example.com", "test", function(err, userData) {
          should.exist(err);
          should.exist(err.name);
          err.name.should.equal("ELOGINFAILED");
          should.not.exist(userData);
          done();
        });
      });
      it("login with wrong `passowrd`", function(done) {
        auth.login("cortezwaters@example.com", "abc", function(err, userData) {
          should.exist(err);
          should.exist(err.name);
          err.name.should.equal("ELOGINFAILED");
          should.not.exist(userData);
          done();
        });
      });
      it("test 10 failing logins and check for different durations. Prevent timing attacks.", function(done) {
        var afns, i, _i,
          _this = this;
        afns = [];
        for (i = _i = 1; _i <= 10; i = ++_i) {
          afns.push(function(cba) {
            var _start;
            _start = Date.now();
            auth.login("cortezwaters@example.com", "abc", function(err, userData) {
              should.exist(err);
              should.exist(err.name);
              err.name.should.equal("ELOGINFAILED");
              should.not.exist(userData);
              cba(null, Date.now() - _start);
            });
          });
        }
        async.series(afns, function(err, _durations) {
          var _range;
          _range = _.max(_durations) - _.min(_durations);
          _range.should.be.above(100);
          done();
        });
      });
      return it("login", function(done) {
        auth.login("cortezwaters@example.com", "test", function(err, userData) {
          should.not.exist(err);
          should.exist(userData);
          userData.name.should.equal("Cortez Waters");
          done();
        });
      });
    });
  });

}).call(this);
