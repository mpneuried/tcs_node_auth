_ = require( "lodash" )._

class DummyDB
	constructor: ( @coll )->
		return

	# Dummy db methods
	has: ( query, cb )=>
		if _.some( @coll, query )
			cb( null, true )
		else
			cb( null, false )
		return

	filter: ( query, cb )=>
		_result = _.filter( @coll, query )
		cb( null, _result )
		return

	create: ( data, cb )=>
		newID = _.max( @coll, "id" ).id + 1
		data.id = newID
		@coll.push( data )
		cb( null, data )
		return

	get: =>
		[ args..., cb ] = arguments
		[ crit, key ] = args
		_query = {}
		_query[ key or "id" ] = crit

		@filter _query, ( err, users )=>
			if not users?.length 
				cb( new Error( "not-found" ) )
				return
			cb( null, users[ 0 ] )
			return
		return

	update: ( id, data, cb )=>
		@get id, ( err, user )=>
			if err
				cb( err )
				return
			cb( null, _.extend( user, data ) )
			return
		return

class DefektUserStore extends DummyDB
	# UserStore methods
	getUserCredentials: ( email, cb )=>
		@filter email: email, ( err, users )=>
			if not users?.length 
				cb( new Error( "not-found" ) )
				return
			cb( err, users[ 0 ].password, users[ 0 ] )
			return
		return

	checkUserEmail: ( email, cb )=>
		@has( email: email, cb )
		return

	setUserCredentials: ( email, passwordcypt, cb )=>
		_user =
			name: null
			email: email
			password: passwordcypt
		@get email, "email", ( err, user )=>
			if err and err?.name is "not-found"
				cb( err )

			if user?
				@update user.id, password: passwordcypt, ( err, dbUser )=>
					if err
						cb( err )
						return
					cb( null, dbUser )
					return
			else
				@create _user, ( err, dbUser )=>
					if err
						cb( err )
						return
					cb( null, dbUser )
					return
				return
		return

	setUserMail: ( current_email, new_email, cb )=>
		@get current_email, "email", ( err, user )=>
			if err
				cb( err )
				return
			@update user.id, email: new_email, ( err, dbUser )=>
				if err
					cb( err )
					return
				cb( null, dbUser )
				return
			return
		return

class DummyUserStore extends DefektUserStore
	getMailContent: ( type ,tokenOrNewmail, options, cb )=>
		switch type
			when "register" then mailData = { subject: "Test activation" }
			when "forgot" then mailData = { subject: "Test password forgot" }
			when "changemail" then mailData = { subject: "Test change mail" }
			when "notifyoldmail" then mailData = { subject: "Test notify old mail" }
		if type is "notifyoldmail"
			mailData.body = "Your mail has changed to `#{tokenOrNewmail}`."
		else if options?.testMissingLink?
			mailData.body = "Body without token should cause an error."
		else
			mailData.body = "Follow http://www.test.com/#{tokenOrNewmail} to set your password."

		cb( null, mailData )
		return

class NotFunctionUserStore extends DefektUserStore
	getActivationMail: 123

module.exports = 
	main: new DummyUserStore( require( "./dummydata" ) )
	notfunction: new NotFunctionUserStore( require( "./dummydata" ) )
	missingmethod: new DefektUserStore( require( "./dummydata" ) )