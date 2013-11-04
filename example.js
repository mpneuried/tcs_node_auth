// import express
var express = require( "express" )

// import your favorite database driver and create the UserStore
// This is just a dummy Driver to return some data
var DbPlaceholder = {
	find: function( q, cb ){if( q.email == "exists@test.de"){ cb( null, { email: "exists@test.de", id: 42 } ); }else{ cb( null );} },
	createOrUpdateByMail: function( mail, data, cb ){cb( null, { email: mail, id: 23 } );},
	updateByMail:function( email, data, cb ){if( email == "exists@test.de"){cb( null, { email: data.email, id: 42 } );}else{cb( null );}}
}

var UserStore = {
	// implement the method to get a user by mail
	getUserCredentials: function( email, callback ){ 
		DbPlaceholder.find( { email: email }, function( err, dbUser ){
			if( err ){ callback( err ); return }
			if( dbUser != void(0) ){
				callback( new Error( "mail-not-found" ) ) 
			} else {
				callback( null, dbUser.password, dbUser ) 
			}
		});
	},
	// implement the method to check if a mail allready exists
	checkUserEmail: function( email, callback ){ 
		DbPlaceholder.find( { email: email }, function( err, dbUser ){
			if( err ){ callback( err ); return }
			if( dbUser != void(0) ){
				callback( null, true ) 
			} else {
				callback( null, false ) 
			}
		});
	},
	// implement the method to create a new user after a succesfull activation
	setUserCredentials: function( email, passwordcypt, callback ){ 
		DbPlaceholder.createOrUpdateByMail( email, { email: email, password: passwordcypt }, function( err, dbUser ){
			if( err ){ callback( err ); return }
			callback( null, dbUser ) 
		});
	},
	// implement the method to change a mail by mail
	setUserMail: function(  current_email, new_email, callback ){ 
		DbPlaceholder.updateByMail( current_email, { email: new_email }, function( err, dbUser ){
			if( err ){ callback( err ); return }
			callback( null, dbUser ) 
		});
	},
	// implement the method to generate the activation mail content
	getMailContent: function( type, tokenOrNewmail, options, callback ){
		switch( type ){
			case "register":
				_mail = {
					subject: "Welcome to my app",
					body: "Visit http://www.myapp.com/activation/" + tokenOrNewmail + " to activate your account." 
				}
				break;
			case "forgot":
				_mail = {
					subject: "Reset your password for my app",
					body: "Visit http://www.myapp.com/activation/" + tokenOrNewmail + " to change your account password." 
				}
				break;
			case "changemail":
				_mail = {
					subject: "Confirm your new mail",
					body: "Visit http://www.myapp.com/activation/" + tokenOrNewmail + " to confirm your changed mail." 
				}
				break;
			case "notifyoldmail":
				_mail = {
					subject: "Your mail has been changed",
					body: "This is just a notification send to you after your mail has been cghanged to `" + tokenOrNewmail + "`." 
				}
				break;
		}
		callback( null, _mail )
		return
	}
}

// init the AuthApp
var AuthApp = require( "tcs_node_auth" );
_config = {
	mailAppId: "mymailappid",
	mailConfig: {
		simulate: true, // Example useage: use the simulated version to create a console out instead of sending a mail.
		senderemail: "no-reply@myapp.com"
	}
};
var authHelper = new AuthApp( UserStore, _config )

// init and configure express
var app = express();
app
	.use(express.bodyParser())
	.use(express.cookieParser())
	.use(express.session({ secret: 'keyboard cat', key: 'sid', cookie: { secure: true }}));


// define the express routes

// login endpoint
app.post( "/login", function( req, res ){
	// call the login method
	authHelper.login( req.body.email, req.body.password, function( err, userData ){
		if( err ){ res.send( 500, err );return }
		// create youre session
		req.session._user = userData;
		res.redirect( "/app.html" );
	});
});

// register endpoint
app.post( "/activation/register", function( req, res ){
	// call the register method
	authHelper.register( req.body.email, function( err ){
		if( err ){ res.send( 500, err );return }
		// output a info page
		res.send( "render: waitforactivation" );
	});
});

// forgot token endpoint
app.post( "/activation/forgot", function( req, res ){
	// call the forgot method
	authHelper.forgot( req.body.email, function( err ){
		if( err ){ res.send( 500, err );return }
		// output a info page
		res.send( "render: waitforactivation" );
	});
});

// change mail endpoint
app.post( "/activation/changemail", function( req, res ){
	// call the changemail method
	authHelper.changeMail( req.body.current_email, req.body.new_email, function( err ){
		if( err ){ res.send( 500, err );return }
		// output a info page
		res.send( "render: waitforactivation" );
	});
});

// read the content of a token
app.get( "/activation/:token", function( req, res ){
	// call the getToken method
	authHelper.getToken( req.params.token, function( err, tokenData ){
		// render a page for an invalid or expired token
		if( err && err.name == "token-not-found" ){ res.send( "render: invalidtoken" );return }
		// output an error
		if( err ){ res.send( 500, err );return }
		console.log(tokenData);
		res.send( "render: do somthing with the token" );
	});
});

// a general endpoint to handle all generated tokens
app.post( "/activation/create/:token", function( req, res ){
	// call the activate method
	authHelper.activate( req.params.token, req.body.password, function( err, userData ){
		if( err ){ res.send( 500, err );return }
		// create youre session
		req.session._user = userData;
		res.send( "render/redirect: app" );
	});
});

app.listen( 8080 )