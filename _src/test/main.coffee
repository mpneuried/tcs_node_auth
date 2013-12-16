should = require( "should" )
async = require( "async" )
_ = require( "lodash" )._

TCSAuth = require( "../lib/auth" )
DummyUserStores = require( "./dummy_userstore" )

auth = null

config = 
	mailAppId: "testapp"
	mailConfig:
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

	_mailTestL = "cortezwaters@example.com"

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
			auth.login _mailTestL, null, ( err, userData )->
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
			auth.login _mailTestL, "abc", ( err, userData )->
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
					auth.login _mailTestL, "abc", ( err, userData )->
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
			auth.login _mailTestL, "test", ( err, userData )->
				should.not.exist( err )
				
				should.exist( userData )
				userData.name.should.equal( "Cortez Waters" )
				done()
				return
			return

	testTokens = {}

	_mailTestR = "testR@example.com"

	describe "- Regsiter -", ->

		it "register with existing mail", ( done )->
			auth.register _mailTestL, ( err )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "EMAILINVALID" )
				done()
				return
			return

		it "register empty mail", ( done )->
			auth.register null, ( err )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "EMISSINGMAIL" )
				done()
				return
			return

		it "register with missing link", ( done )->
			auth.register _mailTestR, { testMissingLink: true }, ( err )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "EUSTOREMAILTOKEN" )
				done()
				return
			return

		it "register", ( done )->

			auth.once "register", ( token, email )->
				email.should.equal( _mailTestR.toLowerCase() )
				testTokens[ _mailTestR ] = token
				done()
				return

			auth.once "mail", ( mail )->
				mail.should.equal( _mailTestR.toLowerCase() )
				return

			auth.register _mailTestR, ( err )->
				should.not.exist( err )
				return
			return

	describe "- Get Token -", ->

		it "token = `null`", ( done )->
			auth.getToken null, ( err )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "EMISSINGTOKEN" )
				done()
				return
			return

		it "empty token", ( done )->
			auth.getToken "", ( err )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "EMISSINGTOKEN" )
				done()
				return
			return

		it "unkonwn token", ( done )->
			auth.getToken "123456789", ( err )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "ETOKENNOTFOUND" )
				done()
				return
			return

		it "getToken", ( done )->
			auth.getToken testTokens[ _mailTestR ], ( err, tokenData )->
				should.not.exist( err )

				should.exist( tokenData )
				tokenData.should.have.property( "email" ).with.equal( _mailTestR.toLowerCase() )
				tokenData.should.have.property( "type" ).with.equal( "register" )
				tokenData.should.have.property( "time" ).with.have.type( "number" ) 
				done()
				return
			return

	_mailTestF = "krissanford@example.com"

	describe "- Forgot Password -", ->

		it "forgot with not existing mail", ( done )->
			auth.forgot "unknown@example.com", ( err )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "EMAILINVALID" )
				done()
				return
			return

		it "forgot mail = `null`", ( done )->
			auth.forgot null, ( err )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "EMISSINGMAIL" )
				done()
				return
			return

		it "forgot empty mail", ( done )->
			auth.forgot "", ( err )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "EMISSINGMAIL" )
				done()
				return
			return

		it "forgot password", ( done )->

			auth.once "forgot", ( token, email )->
				email.should.equal( _mailTestF )
				testTokens[ _mailTestF ] = token
				done()
				return

			auth.once "mail", ( mail )->
				mail.should.equal( _mailTestF )
				return

			auth.forgot _mailTestF, ( err, tokenData )->
				should.not.exist( err )
				return
			return

		it "activate forgotten password", ( done )->
			auth.activate testTokens[ _mailTestF ], "testpw", ( err, userData )->
				should.not.exist( err )

				should.exist( userData )
				userData.should.have.property( "email" ).with.equal( _mailTestF )
				done()
				return
			return

		it "try activate forgotpassword a second time", ( done )->
			auth.activate testTokens[ _mailTestF ], "testpw", ( err, userData )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "ETOKENNOTFOUND" )
				done()
				return
			return

		it "login with new password", ( done )->
			auth.login _mailTestF, "testpw", ( err, userData )->
				should.not.exist( err )
				
				should.exist( userData )
				userData.email.should.equal( _mailTestF )
				done()
				return
			return

	_mailTestCO = "krissanford@example.com"
	_mailTestCE = "cortezwaters@example.com"
	_mailTestCN = "changed@example.com"

	describe "- Change Mail -", ->

		it "change with not existing current_email", ( done )->
			auth.changeMail "unknown@example.com", _mailTestCN, ( err )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "EMAILINVALID" )
				done()
				return
			return

		it "change current_email = `null`", ( done )->
			auth.changeMail null, _mailTestCN, ( err )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "EMISSINGMAIL" )
				done()
				return
			return

		it "change empty current_email", ( done )->
			auth.changeMail "", _mailTestCN, ( err )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "EMISSINGMAIL" )
				done()
				return
			return

		it "change with existing new_email", ( done )->
			auth.changeMail _mailTestCO, _mailTestCE, ( err )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "ENEWMAILINVALID" )
				done()
				return
			return

		it "change new_email = `null`", ( done )->
			auth.changeMail _mailTestCO, null, ( err )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "EMISSINGNEWMAIL" )
				done()
				return
			return

		it "change empty new_email", ( done )->
			auth.changeMail _mailTestCO, "", ( err )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "EMISSINGNEWMAIL" )
				done()
				return
			return

		it "change mail", ( done )->

			auth.once "changemail", ( token, email, newemail )->
				email.should.equal( _mailTestCO )
				newemail.should.equal( _mailTestCN )
				testTokens[ _mailTestCO ] = token
				done()
				return

			auth.once "mail", ( newemail )->
				newemail.should.equal( _mailTestCN )
				return

			auth.changeMail _mailTestCO, _mailTestCN, ( err, tokenData )->
				should.not.exist( err )
				return
			return

		it "activate changed mail", ( done )->

			auth.once "activated", ( token, tokenData )->
				tokenData.email.should.equal( _mailTestCO )
				tokenData.newemail.should.equal( _mailTestCN )
				done()
				return

			auth.once "mail", ( email )->
				email.should.equal( _mailTestCO )
				return

			auth.activate testTokens[ _mailTestCO ], null, ( err, userData )->
				should.not.exist( err )

				should.exist( userData )
				userData.should.have.property( "email" ).with.equal( _mailTestCN )
				return
			return

		it "try activate change mail a second time", ( done )->
			auth.activate testTokens[ _mailTestCO ], null, ( err, userData )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "ETOKENNOTFOUND" )
				done()
				return
			return

		it "login with changed email", ( done )->
			auth.login _mailTestCN, "testpw", ( err, userData )->
				should.not.exist( err )
				
				should.exist( userData )
				userData.email.should.equal( _mailTestCN )
				done()
				return
			return

	describe "- Activate -", ->

		it "not existing token", ( done )->
			auth.activate "123456789", "testpw", ( err )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "ETOKENNOTFOUND" )
				done()
				return
			return

		it "empty token", ( done )->
			auth.activate "", "testpw", ( err )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "EMISSINGTOKEN" )
				done()
				return
			return

		it "token = `null`", ( done )->
			auth.activate "", "testpw", ( err )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "EMISSINGTOKEN" )
				done()
				return
			return

		it "empty password", ( done )->
			auth.activate testTokens[ _mailTestR ], "", ( err )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "EMISSINGPASSWORD" )
				done()
				return
			return

		it "password = `null`", ( done )->
			auth.activate testTokens[ _mailTestR ], "", ( err )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "EMISSINGPASSWORD" )
				done()
				return
			return

		it "activate register", ( done )->
			auth.activate testTokens[ _mailTestR ], "testpw", ( err, userData )->
				should.not.exist( err )

				should.exist( userData )
				userData.should.have.property( "email" ).with.equal( _mailTestR.toLowerCase() )
				done()
				return
			return

		it "try activate register a second time", ( done )->
			auth.activate testTokens[ _mailTestR ], "testpw", ( err, userData )->
				should.exist( err )
				should.exist( err.name )
				err.name.should.equal( "ETOKENNOTFOUND" )
				done()
				return
			return

		it "login for activated account", ( done )->
			auth.login _mailTestR, "testpw", ( err, userData )->
				should.not.exist( err )
				
				should.exist( userData )
				userData.email.should.equal( _mailTestR.toLowerCase() )
				done()
				return
			return

	return


