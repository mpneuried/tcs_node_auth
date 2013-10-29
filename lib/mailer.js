(function() {
  var MailClient, Mailer,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  MailClient = require('tcs_node_mail_client');

  module.exports = Mailer = (function(_super) {
    __extends(Mailer, _super);

    Mailer.prototype.defaults = function() {
      return this.extend(true, Mailer.__super__.defaults.apply(this, arguments), {
        mailAppId: null,
        mailConfig: {}
      });
    };

    function Mailer(app, options) {
      this.app = app;
      this.ERRORS = __bind(this.ERRORS, this);
      this.sendMail = __bind(this.sendMail, this);
      this.start = __bind(this.start, this);
      this.initialize = __bind(this.initialize, this);
      this.defaults = __bind(this.defaults, this);
      Mailer.__super__.constructor.call(this, options);
      return;
    }

    Mailer.prototype.initialize = function() {
      if (!this.config.mailAppId) {
        this._handleError("INIT", "EMAILERNOCONFIG");
        return;
      }
      this.factory = new MailClient(this.config.mailAppId, this.config.mailConfig);
      this.app.on("ready", this.start);
    };

    Mailer.prototype.start = function() {
      this.app.on("mail", this.sendMail);
    };

    Mailer.prototype.sendMail = function(receiver, data, cb) {
      var mail, _ref,
        _this = this;
      this.debug("send mail to " + receiver);
      mail = this.factory.create();
      mail.to(receiver);
      mail.subject(data.subject);
      mail.html(data.body);
      if ((_ref = data.sender) != null ? _ref.length : void 0) {
        mail.reply(data.sender);
      }
      mail.send(function(err) {
        if (err) {
          if (cb) {
            cb(err);
          } else {
            _this.error("send mail", err);
          }
          return;
        }
        _this.debug("send mail", receiver, data);
        if (cb) {
          cb(null);
        }
      });
    };

    Mailer.prototype.ERRORS = function() {
      return this.extend(Mailer.__super__.ERRORS.apply(this, arguments), {
        "EMAILERNOCONFIG": "To use the mail service you have to configurate `notifications_tcsmail` in `config.json`"
      });
    };

    return Mailer;

  })(require("./basic"));

}).call(this);
