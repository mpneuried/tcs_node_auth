MailClient = require 'tcs_node_mail_client'

module.exports = class Mailer extends require( "./basic" )

	defaults: =>
		return @extend true, super,
			mailAppId: null
			mailConfig: null

	constructor: ( @app, options )->
		super( options )
		return

	initialize: =>
		if @config.mailAppId is false
			@info "internal mailer deactivated"
			return

		if not @config.mailAppId
			@_handleError( "INIT", "EMAILERNOCONFIG" )
			return

		@factory = new MailClient( @config.mailAppId, @config.mailConfig )
		@app.on "ready", @start
		return

	start: =>
		@app.on "mail", @sendMail
		return

	sendMail: ( receiver, data, cb )=>
		# return imediatly if mailer is deactivated
		if @config.mailAppId is false
			cb( null ) if cb
			return

		@debug "send mail to #{receiver}"
		mail = @factory.create()
		mail.to( receiver )

		mail.subject( data.subject )

		mail.html( data.body )

		mail.reply( data.sender ) if data.sender?.length

		mail.send ( err )=>
			if err
				if cb
					cb( err )
				else
					@error "send mail", err
				return
			@debug "send mail", receiver, data
			cb( null ) if cb
			return 
		return


	ERRORS: =>
		@extend super, 
			"EMAILERNOCONFIG": "To use the mail service you have to configurate `notifications_tcsmail` in `config.json`"