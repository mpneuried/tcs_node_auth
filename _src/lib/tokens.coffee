utils = require( "./utils" )
crypto = require( "./crypto" )

module.exports = class TokenStore extends require( "./basic" )
	defaults: =>
		return @extend true, super,
			namespace: "tcsnodeauth"
			tokenAlgorithm: "des3"
			tokenPwKey: "TOKENCIPHER"
			tokentimeout: 604800
			maxUserTokens: 5

	constructor: ( @redis, options )->
		super( options )
		@crypto = crypto( @config.tokenAlgorithm )

		@getByToken = @_waitUntilReady( @_getByToken )
		@getByMail = @_waitUntilReady( @_getByMail )
		@create = @_waitUntilReady( @_create )
		@remove = @_waitUntilReady( @_remove )

		@ready = false
		@getTokenPw ( err, tknpw )=>
			@debug "got token password", tknpw
			@tknpw = tknpw
			@ready = true

			@emit "ready"
			return
		return

	crypt: ( type, email, time = Date.now() )=>
		_crypted = @crypto.crypt( @tknpw,  type + ":" + email + ":" + time )
		@debug "crypted", _crypted
		return _crypted

	decrypt: ( token )=>
		_str = @crypto.decrypt( @tknpw, token )
		@debug "decrypted", _str
		[ type, email, time ] = _str.split( ":" )
		ret = 
			type: type
			email: email
			time: parseInt( time, 10 )
		return ret

	_getByToken: ( token, cb )=>
		try
			_data = @decrypt( token )
		catch _err
			@_handleError( cb, "ETOKENNOTFOUND" )
			return

		_key = @_tRedisKey( _data.email )

		@redis.lrange _key, 0, -1, ( err, tokens )=>
			if err
				cb( err )
				return
			@debug "found tokens", tokens
			if token in tokens
				cb( null, _data )
			else
				@_handleError( cb, "ETOKENNOTFOUND" )
			return
		return

	_getByMail: ( mail, cb )=>
		_key = @_tRedisKey( mail )

		#get the newest token
		@redis.lindex _key, 0, ( err, token )=>
			if err
				cb( err )
				return
			@debug "token by mail", tokens
			try
				_data = @decrypt( token )
			catch _err
				@_handleError( cb, "ETOKENNOTFOUND" )
				return
			cb( null, _data )
			return
		return

	_create: ( type, mail, cb )=>
		_token = @crypt( type, mail )
		_key = @_tRedisKey( mail )
		
		rM = []
		rM.push [ "LPUSH", _key, _token ]
		rM.push [ "LTRIM", _key, 0, @config.maxUserTokens - 1 ]
		rM.push [ "EXPIRE", _key, @config.tokentimeout ]

		@redis.multi( rM ).exec ( err, results )=>
			if err
				cb( err )
				return
			[ tokencount, trimsuccess, expsuccess ] = results
			@emit "token:count", mail, tokencount
			@debug "created token", _token, mail, tokencount
			cb( null, _token )
			return
		return

	_remove: ( mail, cb )=>
		_key = @_tRedisKey( mail )
		@redis.del _key, ( err, success )=>
			if err
				cb( err )
				return
			cb( null )
			return
		return

	_tRedisKey: ( mail )=>
		@config.namespace + ":MAILS:" + mail

	getTokenPw: ( cb )=>
		_key = @config.namespace + ":" + @config.tokenPwKey
		@redis.get _key, ( err, tknpw )=>
			if err
				cb( err )
				return

			if tknpw?.length
				# password exists so use it
				cb( null, tknpw )
			else
				# password doesn't exist so generate a random password
				tknpw = utils.randomString( 15, 1 )
				@redis.set _key, tknpw, ( err )=>
					if err
						cb( err )
						return
					cb( null, tknpw )
					return
			return
		return

	ERRORS: =>
		@extend super, 
			"ETOKENNOTFOUND": "The token is not valid"
