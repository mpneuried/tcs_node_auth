(function() {
  var DummyUserStores, TCSAuth, async, auth, config, should, _;

  should = require("should");

  async = require("async");

  _ = require("lodash")._;

  TCSAuth = require("../lib/auth");

  DummyUserStores = require("./dummy_userstore");

  auth = null;

  config = {
    mailAppId: "testapp",
    mailConfig: {
      simulate: true
    }
  };

  describe("=== MAIN TESTS === ", function() {
    var testTokens, _mailTestCE, _mailTestCN, _mailTestCO, _mailTestF, _mailTestL, _mailTestR;
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
          _err.name.should.equal("EUSTOREMISSINGMETHOD");
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
          _err.name.should.equal("EUSTOREMISSINGMETHOD");
          done();
        }
      });
      return it("create auth app", function(done) {
        auth = new TCSAuth(DummyUserStores.main, config);
        auth.should.be.an.instanceOf(TCSAuth);
        done();
      });
    });
    _mailTestL = "cortezwaters@example.com";
    describe("- Login -", function() {
      it("login with missing empty `email`", function(done) {
        auth.login(null, "test", function(err, userData) {
          should.exist(err);
          should.exist(err.name);
          err.name.should.equal("EMISSINGMAIL");
          should.not.exist(userData);
          done();
        });
      });
      it("login with missing empty `passowrd`", function(done) {
        auth.login(_mailTestL, null, function(err, userData) {
          should.exist(err);
          should.exist(err.name);
          err.name.should.equal("EMISSINGPASSWORD");
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
        auth.login(_mailTestL, "abc", function(err, userData) {
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
            auth.login(_mailTestL, "abc", function(err, userData) {
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
        auth.login(_mailTestL, "test", function(err, userData) {
          should.not.exist(err);
          should.exist(userData);
          userData.name.should.equal("Cortez Waters");
          done();
        });
      });
    });
    testTokens = {};
    _mailTestR = "testR@example.com";
    describe("- Regsiter -", function() {
      it("register with existing mail", function(done) {
        auth.register(_mailTestL, function(err) {
          should.exist(err);
          should.exist(err.name);
          err.name.should.equal("EMAILINVALID");
          done();
        });
      });
      it("register empty mail", function(done) {
        auth.register(null, function(err) {
          should.exist(err);
          should.exist(err.name);
          err.name.should.equal("EMISSINGMAIL");
          done();
        });
      });
      it("register with missing link", function(done) {
        auth.register(_mailTestR, {
          testMissingLink: true
        }, function(err) {
          should.exist(err);
          should.exist(err.name);
          err.name.should.equal("EUSTOREMAILTOKEN");
          done();
        });
      });
      return it("register", function(done) {
        auth.once("register", function(token, email) {
          email.should.equal(_mailTestR);
          testTokens[_mailTestR] = token;
          done();
        });
        auth.register(_mailTestR, function(err) {
          should.not.exist(err);
        });
      });
    });
    describe("- Get Token -", function() {
      it("token = `null`", function(done) {
        auth.getToken(null, function(err) {
          should.exist(err);
          should.exist(err.name);
          err.name.should.equal("EMISSINGTOKEN");
          done();
        });
      });
      it("empty token", function(done) {
        auth.getToken("", function(err) {
          should.exist(err);
          should.exist(err.name);
          err.name.should.equal("EMISSINGTOKEN");
          done();
        });
      });
      it("unkonwn token", function(done) {
        auth.getToken("123456789", function(err) {
          should.exist(err);
          should.exist(err.name);
          err.name.should.equal("ETOKENNOTFOUND");
          done();
        });
      });
      return it("getToken", function(done) {
        auth.getToken(testTokens[_mailTestR], function(err, tokenData) {
          should.not.exist(err);
          should.exist(tokenData);
          tokenData.should.have.property("email")["with"].equal(_mailTestR);
          tokenData.should.have.property("type")["with"].equal("register");
          tokenData.should.have.property("time")["with"].have.type("number");
          done();
        });
      });
    });
    _mailTestF = "krissanford@example.com";
    describe("- Forgot Password -", function() {
      it("forgot with not existing mail", function(done) {
        auth.forgot("unknown@example.com", function(err) {
          should.exist(err);
          should.exist(err.name);
          err.name.should.equal("EMAILINVALID");
          done();
        });
      });
      it("forgot mail = `null`", function(done) {
        auth.forgot(null, function(err) {
          should.exist(err);
          should.exist(err.name);
          err.name.should.equal("EMISSINGMAIL");
          done();
        });
      });
      it("forgot empty mail", function(done) {
        auth.forgot("", function(err) {
          should.exist(err);
          should.exist(err.name);
          err.name.should.equal("EMISSINGMAIL");
          done();
        });
      });
      it("forgot password", function(done) {
        auth.once("forgot", function(token, email) {
          email.should.equal(_mailTestF);
          testTokens[_mailTestF] = token;
          done();
        });
        auth.forgot(_mailTestF, function(err, tokenData) {
          should.not.exist(err);
        });
      });
      it("activate forgotten password", function(done) {
        auth.activate(testTokens[_mailTestF], "testpw", function(err, userData) {
          should.not.exist(err);
          should.exist(userData);
          userData.should.have.property("email")["with"].equal(_mailTestF);
          done();
        });
      });
      return it("login with new password", function(done) {
        auth.login(_mailTestF, "testpw", function(err, userData) {
          should.not.exist(err);
          should.exist(userData);
          userData.email.should.equal(_mailTestF);
          done();
        });
      });
    });
    _mailTestCO = "krissanford@example.com";
    _mailTestCE = "cortezwaters@example.com";
    _mailTestCN = "changed@example.com";
    describe("- Change Mail -", function() {
      it("change with not existing current_email", function(done) {
        auth.changeMail("unknown@example.com", _mailTestCN, function(err) {
          should.exist(err);
          should.exist(err.name);
          err.name.should.equal("EMAILINVALID");
          done();
        });
      });
      it("change current_email = `null`", function(done) {
        auth.changeMail(null, _mailTestCN, function(err) {
          should.exist(err);
          should.exist(err.name);
          err.name.should.equal("EMISSINGMAIL");
          done();
        });
      });
      it("change empty current_email", function(done) {
        auth.changeMail("", _mailTestCN, function(err) {
          should.exist(err);
          should.exist(err.name);
          err.name.should.equal("EMISSINGMAIL");
          done();
        });
      });
      it("change with existing new_email", function(done) {
        auth.changeMail(_mailTestCO, _mailTestCE, function(err) {
          should.exist(err);
          should.exist(err.name);
          err.name.should.equal("ENEWMAILINVALID");
          done();
        });
      });
      it("change new_email = `null`", function(done) {
        auth.changeMail(_mailTestCO, null, function(err) {
          should.exist(err);
          should.exist(err.name);
          err.name.should.equal("EMISSINGNEWMAIL");
          done();
        });
      });
      it("change empty new_email", function(done) {
        auth.changeMail(_mailTestCO, "", function(err) {
          should.exist(err);
          should.exist(err.name);
          err.name.should.equal("EMISSINGNEWMAIL");
          done();
        });
      });
      it("change mail", function(done) {
        auth.once("changemail", function(token, email, newemail) {
          email.should.equal(_mailTestCO);
          newemail.should.equal(_mailTestCN);
          testTokens[_mailTestCO] = token;
          done();
        });
        auth.changeMail(_mailTestCO, _mailTestCN, function(err, tokenData) {
          should.not.exist(err);
        });
      });
      it("activate changed mail", function(done) {
        auth.activate(testTokens[_mailTestCO], null, function(err, userData) {
          should.not.exist(err);
          should.exist(userData);
          userData.should.have.property("email")["with"].equal(_mailTestCN);
          done();
        });
      });
      return it("login with changed email", function(done) {
        auth.login(_mailTestCN, "testpw", function(err, userData) {
          should.not.exist(err);
          should.exist(userData);
          userData.email.should.equal(_mailTestCN);
          done();
        });
      });
    });
    describe("- Activate -", function() {
      it("not existing token", function(done) {
        auth.activate("123456789", "testpw", function(err) {
          should.exist(err);
          should.exist(err.name);
          err.name.should.equal("ETOKENNOTFOUND");
          done();
        });
      });
      it("empty token", function(done) {
        auth.activate("", "testpw", function(err) {
          should.exist(err);
          should.exist(err.name);
          err.name.should.equal("EMISSINGTOKEN");
          done();
        });
      });
      it("token = `null`", function(done) {
        auth.activate("", "testpw", function(err) {
          should.exist(err);
          should.exist(err.name);
          err.name.should.equal("EMISSINGTOKEN");
          done();
        });
      });
      it("empty password", function(done) {
        auth.activate(testTokens[_mailTestR], "", function(err) {
          should.exist(err);
          should.exist(err.name);
          err.name.should.equal("EMISSINGPASSWORD");
          done();
        });
      });
      it("password = `null`", function(done) {
        auth.activate(testTokens[_mailTestR], "", function(err) {
          should.exist(err);
          should.exist(err.name);
          err.name.should.equal("EMISSINGPASSWORD");
          done();
        });
      });
      it("activate", function(done) {
        auth.activate(testTokens[_mailTestR], "testpw", function(err, userData) {
          should.not.exist(err);
          should.exist(userData);
          userData.should.have.property("email")["with"].equal(_mailTestR);
          done();
        });
      });
      return it("login for activated account", function(done) {
        auth.login(_mailTestR, "testpw", function(err, userData) {
          should.not.exist(err);
          should.exist(userData);
          userData.email.should.equal(_mailTestR);
          done();
        });
      });
    });
  });

}).call(this);
