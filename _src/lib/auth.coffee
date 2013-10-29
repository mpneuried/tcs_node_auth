_ = require( "lodash" )._
bcrypt = require( "bcrypt" )
RedisInst = require "redis"

utils = require( "./utils" )
TokenStore = require( "./tokens" )
Mailer = require( "./mailer" )

module.exports = class Auth extends require( "./basic" )

	defaults: =>
		return @extend true, super,
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
		@getToken = @_waitUntilReady( @_getToken )
		@activate = @_waitUntilReady( @_activate )

		@initTokenStore = @_waitForConnection( @_initTokenStore )
		@initTokenStore()

		@mailer = new Mailer( @, @config )		
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
		@tokenStore = new TokenStore( @redis, @config )
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

	_activate: ( token, password, cb )=>
		if not token?.length
			@_handleError( cb, "EMISSINGTOKEN", method: "activate" )
			return
		if not password?.length
			@_handleError( cb, "EMISSINGPASSWORD", method: "activate")
			return

		@_getToken token, ( err, tokenData )=>
			if err
				cb( err )
				return

			salt = bcrypt.genSaltSync( @config.bryptrounds )
			_cryptpassword = bcrypt.hashSync( password, salt )

			@userstore.setUserCredentials tokenData.email, _cryptpassword, ( err, userData )=>
				if err
					cb( err ) 
					return

				@tokenStore.remove tokenData.email, ( err )=>
					if err 
						cb( err )
						return
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

	_create: ( type, email, options, cb )=>

		if not email?.length
			@_handleError( cb, "EMISSINGMAIL", method: type )
			return

		@userstore.checkUserEmail email, ( err, exists )=>
			if err
				@_handleError( cb, err )
				return
			if exists
				@warning "mail `#{email}` exists"
				@_handleError( cb, "EMAILNOTALLOWED", email: email )
				return

			@tokenStore.create type, email, ( err, token )=>
				if err
					cb( err )
					return

				@userstore.getMailContent type, token, options, ( err, mailData )=>
					if err
						cb( err )
						return

					if mailData.body?.indexOf?( token ) >= 0
						@emit "mail", email, mailData
						cb( null )
						@emit type, token, email
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
			"EMISSINGPASSWORD": "To invoke a `<%= method %>`you have to define the password argument."
			"EMISSINGTOKEN": "To invoke a `<%= method %>`you have to define the token argument."
			"EMAILNOTALLOWED": "The given mail `<%= mail %>` is not allowed."
			"EUSTOREMISSINGMETHOD": "Missing method `<%= method %>` in UserStore"
			"EUSTOREMISSINGPASSWORD": "Found user with the email \"<%= email %>\", but it has no password saved."
			"EUSTOREMAILTOKEN": "The token has has not been fount within the mail body"