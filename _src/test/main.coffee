should = require( "should" )
async = require( "async" )
_ = require( "lodash" )._

TCSAuth = require( "../lib/auth" )
DummyUserStores = require( "./dummy_userstore" )

auth = null

config = 
	mailAppId: "testing"
	mailConfig: 
		sendermail: "auth@example.com"
		simulate: true

describe "=== MAIN TESTS === ", ->
	describe "- Init -", ->
		it "create auth app. UserStore with missing method.", ( done )->
			try
				new TCSAuth( DummyUserStores.missingmethod, config )
				throw "Should fail"
			catch _err
				should.exist( _err )
				should.exist( _err.name )
				_err.name.should.equal( "EUSTOREMISSINGMETHOD" )
				done()
			return

		it "create auth app. UserStore with method not a function.", ( done )->
			try
				new TCSAuth( DummyUserStores.notfunction, config )
				throw "Should fail"
			catch _err
				should.exist( _err )
				should.exist( _err.name )
				_err.name.should.equal( "EUSTOREMISSINGMETHOD" )
				done()
			return

		it "create auth app", ( done )->
			auth = new TCSAuth( DummyUserStores.main, config )
			auth.should.be.an.instanceOf( TCSAuth )
			done()
			return

	describe "- Login -", ->

		it "login with missing empty `email`", ( done )->
			auth.login null, "test", ( err, userData )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "EMISSINGMAIL" )

				should.not.exist( userData )
				done()
				return
			return

		it "login with missing empty `passowrd`", ( done )->
			auth.login "cortezwaters@example.com", null, ( err, userData )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "EMISSINGPASSWORD" )

				should.not.exist( userData )
				done()
				return
			return

		it "login with unkown `email`", ( done )->
			auth.login "unknown@example.com", "test", ( err, userData )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "ELOGINFAILED" )

				should.not.exist( userData )
				done()
				return
			return

		it "login with wrong `passowrd`", ( done )->
			auth.login "cortezwaters@example.com", "abc", ( err, userData )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "ELOGINFAILED" )

				should.not.exist( userData )
				done()
				return
			return

		it "test 10 failing logins and check for different durations. Prevent timing attacks.", ( done )->
			
			afns = []
			for i in [1..10]
				afns.push ( cba )->
					_start = Date.now()
					auth.login "cortezwaters@example.com", "abc", ( err, userData )->
						should.exist( err )
						should.exist( err.name )
						err.name.should.equal( "ELOGINFAILED" )

						should.not.exist( userData )

						cba( null, Date.now() - _start )
						return
					return
			async.series afns, ( err, _durations )=>
				_range = _.max( _durations ) - _.min( _durations )
				_range.should.be.above( 100 )
				done()
				return
			return

		it "login", ( done )->
			auth.login "cortezwaters@example.com", "test", ( err, userData )->
				should.not.exist( err )
				
				should.exist( userData )
				userData.name.should.equal( "Cortez Waters" )
				done()
				return
			return

	describe "- Regsiter -", ->

		it "register", ( done )->
			auth.register "test@example.com",( err )->
				should.not.exist( err )
				done()
				return
			return

	return


