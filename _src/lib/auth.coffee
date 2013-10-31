_ = require( "lodash" )._
bcrypt = require( "bcrypt" )
RedisInst = require "redis"

utils = require( "./utils" )
TokenStore = require( "./tokens" )
Mailer = require( "./mailer" )

module.exports = class Auth extends require( "./basic" )

	defaults: =>
		return @extend true, {}, super,
			bryptrounds: 8
			mailAppId: null
			mailConfig: {}
			redis: null

	constructor: ( @userstore, options )->
		super( options )
		@_initRedis()
		@_validateUserStore()

		@login = @_waitUntilReady( @_login )
		@register = @_waitUntilReady( @_register )
		@forgot = @_waitUntilReady( @_forgot )
		@changeMail = @_waitUntilReady( @_changeMail )
		@getToken = @_waitUntilReady( @_getToken )
		@activate = @_waitUntilReady( @_activate )

		@initTokenStore = @_waitForConnection( @_initTokenStore )
		@initTokenStore()

		@mailer = new Mailer( @, _.omit( @config, [ "logging" ] ) )		
		return

	_waitForConnection: ( method )=>
		return =>
			args = arguments
			if @connected
				method.apply( @, args )
			else
				@once "connect", =>
					method.apply( @, args )
					return
			return

	_initRedis: =>
		if @config.redis?.constructor?.name is "RedisClient"
			@redis = @config.redis
		else
			@redis = RedisInst.createClient( @config.redis?.port or 6379, @config.redis?.host or "127.0.0.1", @config.redis?.options or {} )

		@connected = @redis.connected or false
		@redis.on "connect", =>
			@connected = true
			@emit( "connect" )
			return

		@redis.on "error", ( err )=>
			if err.message.indexOf( "ECONNREFUSED" )
				@connected = false
				@emit( "disconnect" )
			else
				@error( "Redis ERROR", err )
				@emit( "error" )
			return
		return

	_initTokenStore: =>
		@ready = false
		@tokenStore = new TokenStore( @redis, _.omit( @config, [ "logging" ] ) )
		@tokenStore.on "ready", =>
			@ready = true
			@emit( "ready" )
			return
		return

	_login: ( email, password, cb )=>
		if not email?.length
			@_handleError( cb, "EMISSINGMAIL", method: "login" )
			return
		if not password?.length
			@_handleError( cb, "EMISSINGPASSWORD", method: "login")
			return

		@userstore.getUserCredentials email, ( err, dbPassword, userData )=>
			if err
				@warning( "EUSTORE", err ) 
				@_delayError( cb, "ELOGINFAILED" )
				return
			if not dbPassword?.length
				@warning( "EUSTOREMISSINGPASSWORD - " + @_ERRORS[ "EUSTOREMISSINGPASSWORD" ]( email: email ) )  
				@_delayError( cb, "ELOGINFAILED" )
				return

			bcrypt.compare password, dbPassword, ( err, same )=>
				@debug "check-pw", dbPassword, err, same
				if err
					@warning( "login", err )
					@_delayError( cb, "ELOGINFAILED" )
					return
				if same
					@emit "login", userData
					cb( null, userData )
				else
					@_delayError( cb, "ELOGINFAILED" )

				return
			return

		return

	_getToken: ( token, cb )=>
		if not token?.length
			@_handleError( cb, "EMISSINGTOKEN", method: "getToken" )
			return

		@tokenStore._getByToken( token, cb )
		return

	_activate: =>
		[ args..., cb ] = arguments
		[ token, password, options ] = args

		if not token?.length
			@_handleError( cb, "EMISSINGTOKEN", method: "activate" )
			return

		@_getToken token, ( err, tokenData )=>
			if err
				cb( err )
				return
			@debug "got token", tokenData

			if tokenData.type is "changemail"
				@userstore.setUserMail tokenData.email, tokenData.newemail, ( err, userData )=>
					if err
						cb( err ) 
						return
					@debug "changed user mail `#{tokenData.email}` to `#{tokenData.newemail}` by token `#{token}`"

					@userstore.getMailContent "notifyoldmail", tokenData.newemail, options, ( err, mailData )=>
						if err
							cb( err )
							return

						@emit "mail", tokenData.email, mailData, ( err )=>
							if err
								cb( err )
								return
							@debug "created token `#{token}` of type `#{tokenData.type}` for mail `#{tokenData.email}`"
							@emit "activated", token, tokenData
							cb( null, userData )
							return
						return
					return
			else
				if not password?.length
					@_handleError( cb, "EMISSINGPASSWORD", method: "activate")
					return

				salt = bcrypt.genSaltSync( @config.bryptrounds )
				_cryptpassword = bcrypt.hashSync( password, salt )

				@userstore.setUserCredentials tokenData.email, _cryptpassword, ( err, userData )=>
					if err
						cb( err ) 
						return
					@debug "created or updated user `#{tokenData.email}` by token `#{token}`"

					@tokenStore.remove tokenData.email, ( err )=>
						if err 
							cb( err )
							return
						@debug "activated mail `#{tokenData.email}` with token `#{token}`"
						cb( null, userData )
						return
					return
			return
		return

	_register: =>
		[ args..., cb ] = arguments
		[ email, options ] = args

		@_create( "register", email, options, cb )
		return

	_forgot: =>
		[ args..., cb ] = arguments
		[ email, options ] = args

		@_create( "forgot", email, options, cb )
		return

	_changeMail: =>
		[ args..., cb ] = arguments
		[ email, newemail, options ] = args
		type = "changemail"

		if not email?.length
			@_handleError( cb, "EMISSINGMAIL", method: type )
			return

		if not newemail?.length
			@_handleError( cb, "EMISSINGNEWMAIL", method: type )
			return

		@userstore.checkUserEmail email, ( err, exists )=>
			if err
				@_handleError( cb, err )
				return

			else if not exists
				@warning "mail `#{email}` not exists"
				@_handleError( cb, "EMAILINVALID", email: email )
				return

			@userstore.checkUserEmail newemail, ( err, exists )=>
				if err
					@_handleError( cb, err )
					return

				else if exists
					@warning "mail `#{email}` not exists"
					@_handleError( cb, "ENEWMAILINVALID", email: newemail )
					return

				@tokenStore.create type, email, newemail, ( err, token )=>
					if err
						cb( err )
						return

					@userstore.getMailContent type, token, options, ( err, mailData )=>
						if err
							cb( err )
							return

						if mailData.body?.indexOf?( token ) >= 0
							@emit "mail", email, mailData, ( err )=>
								if err
									cb( err )
									return
								@debug "created token `#{token}` of type `#{type}` for mail `#{email}`"
								cb( null )
								@emit type, token, email, newemail
								return
						else
							@_handleError( cb, "EUSTOREMAILTOKEN" )
						return
					return
				return
			return
		return

	_create: ( type, email, options, cb )=>
		[ args..., cb ] = arguments
		[ type, email, options ] = args

		if not email?.length
			@_handleError( cb, "EMISSINGMAIL", method: type )
			return

		@userstore.checkUserEmail email, ( err, exists )=>
			if err
				@_handleError( cb, err )
				return
			if type is "register" and exists
				@warning "mail `#{email}` exists"
				@_handleError( cb, "EMAILINVALID", email: email )
				return
			else if type is "forgot" and not exists
				@warning "mail `#{email}` not exists"
				@_handleError( cb, "EMAILINVALID", email: email )
				return

			@tokenStore.create type, email, null, ( err, token )=>
				if err
					cb( err )
					return

				@userstore.getMailContent type, token, options, ( err, mailData )=>
					if err
						cb( err )
						return

					if mailData.body?.indexOf?( token ) >= 0
						@emit "mail", email, mailData, ( err )=>
							@debug "created token `#{token}` of type `#{type}` for mail `#{email}`"
							@emit type, token, email
							cb( null )
							return
					else
						@_handleError( cb, "EUSTOREMAILTOKEN" )
					return
				return

			return

		return

	_validateUserStore: =>
		methods = [ "getUserCredentials", "checkUserEmail", "setUserCredentials", "getMailContent" ]
		for method in methods when not @userstore[ method ]? or not _.isFunction( @userstore[ method ] )
			@_handleError( null, "EUSTOREMISSINGMETHOD", method: method )
			return
		return

	_delayError: =>
		_delay = utils.randRange( 0, 200 )
		args = [ @_handleError, _delay ].concat( Array.prototype.slice.call(arguments) )
		_tfnErr = _.delay.apply( _, args )
		return


	ERRORS: =>
		@extend super, 
			"ELOGINFAILED": "Login failed. Please check your credentials"
			"EMISSINGMAIL": "To invoke a `<%= method %>` you have to define the email argument."
			"EMISSINGNEWMAIL": "To invoke a `<%= method %>` you have to define the current and the new email."
			"EMISSINGPASSWORD": "To invoke a `<%= method %>`you have to define the password argument."
			"EMISSINGTOKEN": "To invoke a `<%= method %>`you have to define the token argument."
			"EMAILINVALID": "The given mail `<%= email %>` is not allowed."
			"ENEWMAILINVALID": "The given mail `<%= email %>` is allready existend."
			"EUSTOREMISSINGMETHOD": "Missing method `<%= method %>` in UserStore"
			"EUSTOREMISSINGPASSWORD": "Found user with the email \"<%= email %>\", but it has no password saved."
			"EUSTOREMAILTOKEN": "The token has has not been fount within the mail body"