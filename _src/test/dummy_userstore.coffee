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

		@create _user, ( err, dbUser )=>
			if err
				cb( err )
				return
			cb( dbUser )
			return
		return

class DummyUserStore extends DefektUserStore
	getMailContent: ( type ,token, options, cb )=>
		switch type
			when "register" then mailData = { subject: "Test activation" }
			when "forgot" then mailData = { subject: "Test activation" }
		if options?.testMissingLink?
			mailData.body = "Body without token should cause an error."
		else
			mailData.body = "Follow http://www.test.com/#{token} to set your password."

		cb( null, mailData )
		return

class NotFunctionUserStore extends DefektUserStore
	getActivationMail: 123

module.exports = 
	main: new DummyUserStore( require( "./dummydata" ) )
	notfunction: new NotFunctionUserStore( require( "./dummydata" ) )
	missingmethod: new DefektUserStore( require( "./dummydata" ) )