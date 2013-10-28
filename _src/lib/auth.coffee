_ = require( "lodash" )._
bcrypt = require( "bcrypt" )

utils = require( "./utils" )

module.exports = class Auth extends require( "./basic" )

	defaults: =>
		return @extend true, super,
			bryptrounds: 8
			tokentimeout: 604800
			defaultsendermail: null
			mailAppId: null
			mailConfig: {}

	constructor: ( @userstore, options )->
		super( options )

		@_validateUserStore()
		return

	login: ( email, password, cb )=>
		if not email?.length
			@_handleError( cb, "ELOGINMISSINGMAIL")
			return
		if not password?.length
			@_handleError( cb, "ELOGINMISSINGPASSWORD")
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
				@debug "chackpw", dbPassword, err, same
				if err
					@warning( "login", err )
					@_delayError( cb, "ELOGINFAILED" )
					return
				if same
					cb( null, userData )
				else
					@_delayError( cb, "ELOGINFAILED" )

				return
			return

		return

	_validateUserStore: =>
		methods = [ "getUserCredentials", "checkUserEmail", "setUserCredentials", "getActivationMail" ]
		for method in methods when not @userstore[ method ]? or not _.isFunction( @userstore[ method ] )
			@_handleError( null, "EMISSINGUSTOREMETHOD", method: method )
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
			"EMISSINGUSTOREMETHOD": "Missing method `<%= method %>` in UserStore"
			"ELOGINMISSINGMAIL": "To invoke a `login` you have to define the first argument with a email."
			"ELOGINMISSINGPASSWORD": "To invoke a `login` you have to define the second argument with a password."
			"EUSTOREMISSINGPASSWORD": "Found user with the email \"<%= email %>\", but it has no password saved."