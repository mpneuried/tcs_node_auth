tcs_node_auth
=============


[![Build Status](https://secure.travis-ci.org/mpneuried/tcs_node_auth.png?branch=master)](http://travis-ci.org/mpneuried/tcs_node_auth)
[![Build Status](https://david-dm.org/mpneuried/tcs_node_auth.png)](https://david-dm.org/mpneuried/tcs_node_auth)
[![NPM version](https://badge.fury.io/js/tcs_node_auth.png)](http://badge.fury.io/js/tcs_node_auth)


Easy to use authentication with activation by mail

This Modules makes it easy to create a secure email user login with verification and save crypted password.

# Features

* Double opt in for emails
* Connect your own Database
* Crypted passwords with the most secure `bcrypt` algorithm.
* Crypted token content. Default algorithm is **des3** but you can use any node algorythm node supports by setting the config `tokenAlgorithm` e.g. **aes128**. 
* Integrated mail service by `tcs_node_mail_client` ( uses AWS mail services )

## Register sequence

![Register sequence](http://www.websequencediagrams.com/cgi-bin/cdraw?lz=VXNlci0-ZXhwcmVzcy5qczogc3RhcnQgc2lnbmluCm5vdGUgb3ZlciAAFg0AGAUgZm9ybQoAMQotPnRjc19ub2RlX2F1dGg6IHJlZ2lzdGVyAEAGcmlnaHQgb2YgABcPLgAfCCggbWFpbCwgY2IgKQoAPg0tPlVzZXI6IFNlbmQAIAUKAIElEmNsaWNrIG9uIGxpbmsAehxnZXRUb2tlAIFVBwB9GQAfCCggdG9rZW4AgQEWAIIsDAAiBURhdGEAgh4XcGFzc3dvcmQAghYhYWN0aXZhdGUAghgfAB8IAIEYCQBZCACBCSJ1c2VyAIEPG2NyZWF0ZSBzZXNzaW9uCg&s=napkin)
<!--http://www.websequencediagrams.com/?lz=VXNlci0-ZXhwcmVzcy5qczogc3RhcnQgc2lnbmluCm5vdGUgb3ZlciAAFg0AGAUgZm9ybQoAMQotPnRjc19ub2RlX2F1dGg6IHJlZ2lzdGVyAEAGcmlnaHQgb2YgABcPLgAfCCggbWFpbCwgY2IgKQoAPg0tPlVzZXI6IFNlbmQAIAUKAIElEmNsaWNrIG9uIGxpbmsAehxnZXRUb2tlAIFVBwB9GQAfCCggdG9rZW4AgQEWAIIsDAAiBURhdGEAgh4XcGFzc3dvcmQAghYhYWN0aXZhdGUAghgfAB8IAIEYCQBZCACBCSJ1c2VyAIEPG2NyZWF0ZSBzZXNzaW9uCg&s=napkin-->

## Forgot password sequence

![Forgot password sequence](http://www.websequencediagrams.com/cgi-bin/cdraw?lz=VXNlci0-ZXhwcmVzcy5qczogc3RhcnQgZm9yZ290IHBhc3N3b3JkCm5vdGUgb3ZlciAAIAwAFw8gZm9ybQoAQwotPnRjc19ub2RlX2F1dGgAKAgARwZyaWdodCBvZiAAFQ8uAHUGKCBtYWlsLCBjYiApCgA6DS0-VXNlcjogU2VuZAAgBQoAgTMSY2xpY2sgb24gbGluawB2HGdldFRva2VuAHUfAB8IKCB0b2tlbgCBARYAgjoMACIFRGF0YQCCIxcAggopYWN0aXZhdGUAghYfAB8IAIEYCQCDMggAgQkidXNlcgCBDxtjcmVhdGUgc2Vzc2lvbgo&s=napkin)
<!--http://www.websequencediagrams.com/?lz=VXNlci0-ZXhwcmVzcy5qczogc3RhcnQgZm9yZ290IHBhc3N3b3JkCm5vdGUgb3ZlciAAIAwAFw8gZm9ybQoAQwotPnRjc19ub2RlX2F1dGgAKAgARwZyaWdodCBvZiAAFQ8uAHUGKCBtYWlsLCBjYiApCgA6DS0-VXNlcjogU2VuZAAgBQoAgTMSY2xpY2sgb24gbGluawB2HGdldFRva2VuAHUfAB8IKCB0b2tlbgCBARYAgjoMACIFRGF0YQCCIxcAggopYWN0aXZhdGUAghYfAB8IAIEYCQCDMggAgQkidXNlcgCBDxtjcmVhdGUgc2Vzc2lvbgo&s=napkin-->

## Change mail sequence

![Forgot password sequence](http://www.websequencediagrams.com/cgi-bin/cdraw?lz=VXNlci0-ZXhwcmVzcy5qczogc3RhcnQgY2hhbmdlIG1haWwKbm90ZSBvdmVyIAAcDAAXCyBmb3JtCgA7Ci0-dGNzX25vZGVfYXV0aAAkCE0ARAlyaWdodCBvZiAAGQ8uAB8KKCBjdXJyZW50X2VtYWlsLCBuZXcAAwhjYiApCgBWDS0-VXNlcjogU2VuZACBLwYAgUcSY2xpY2sgb24gbGluawCBEhxhY3RpdmF0ZQCBDR8AHwgoIHRva2VuAIEQBwCBQx0AgRoFbm9maWZpY2F0aW9uAII5BnRvIG9sZCAAgmgGAIFJDwCDDwx1c2VyRGF0YQCCehhyZWF0ZSBzZXNzaW9uCg&s=napkin)
<!--http://www.websequencediagrams.com/?lz=VXNlci0-ZXhwcmVzcy5qczogc3RhcnQgY2hhbmdlIG1haWwKbm90ZSBvdmVyIAAcDAAXCyBmb3JtCgA7Ci0-dGNzX25vZGVfYXV0aAAkCE0ARAlyaWdodCBvZiAAGQ8uAB8KKCBjdXJyZW50X2VtYWlsLCBuZXcAAwhjYiApCgBWDS0-VXNlcjogU2VuZACBLwYAgUcSY2xpY2sgb24gbGluawCBEhxhY3RpdmF0ZQCBDR8AHwgoIHRva2VuAIEQBwCBQx0AgRoFbm9maWZpY2F0aW9uAII5BnRvIG9sZCAAgmgGAIFJDwCDDwx1c2VyRGF0YQCCehhyZWF0ZSBzZXNzaW9uCg&s=napkin-->

# Install

`npm install tcs_node_auth`

# Example

```js
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
	checkUserEmail: function( email, options, callback ){ 
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
	setUserCredentials: function( email, passwordcypt, isRegister, callback ){ 
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
```

# Initialize

to create the AuthApp call `new` with the configuared `UserStore` and the module configuration.

**`new AuthApp( UserStore, config )`**

####Config-Options:

* **bryptrounds** ( `Number` - *optional; default = `8`* ): The crypto strength. A higher number will cause 
* **tokentimeout** ( `Number` - *optional; default = `604800` 7 days* ): Time in seconds until the token will expire. `0` for unlimited
* **namespace** ( `String` - *optional; default = `tcsnodeauth`* ): The **redis** namespace to prefix all generated data.
* **redis** ( `Object|RedisClient` ): The **redis** configuration. Could be an Object of Configuration or a allready existing instance of `RedisClient`.
	* **host** ( `String` - *optional; default = `127.0.0.1`* ): The redis hostname
	* **port** ( `Number` - *optional; default = `6379`* ): The redis port
	* **options** ( `Object` - *optional* ): The redis connection options
* **defaultsendermail** ( `String` - *optional* ): If defined, this mail will be used as default sender mail. It can always be overwritten by the `UserStore.???MailContent` methods.
* **mailAppId** ( `String` ): The `tcs_node_mail_client` app id. If you set this to `false` the internal mailer will be deactivated. So you can implement your own notify logic.
* **mailConfig** ( `Object` ): The `tcs_node_mail_client` configuration.  
  Details: [tcs_mail_node_client]( https://github.com/mpneuried/tcs_mail_node_client ).
* **tokenAlgorithm** ( `String`- *optional; default = `des3`* ): The crypting algorythm to crypt the data inside a token.

# Methods

### `AuthApp.login( email, password, callback )`

Invoke a user login.

This method make use of the `UserStore.getUserCredentials( email, callback )` Method.

####Arguments:

* **email** ( `String` ): The users email.
* **password** ( `String` ): The users plain password to .
* **callback** ( `Function` ): The callback method.

#### Parameter for `callback( error, userData )`

* **error** ( `String|Error|Object` ): A general error object wich.
* **userData** ( `String|Number|Object` ): Additional data you can use after a successful login. E.g. Data to create your session.

### `AuthApp.register( email [, options], callback )`

Create a user login request.

This method make use of the `UserStore.checkUserEmail( email, options, callback )` and `UserStore.getMailContent( type, link, options, callback )` Methods.

####Arguments:

* **email** ( `String` ): The users email.
* **[options]** ( `String|Number|Object` - *optional* ): Options to be used inside the `UserStore.getMailContent` and `UserStore.checkUserEmail` method.
* **callback** ( `Function` ): The callback method.

#### Parameter for `callback( error )`

* **error** ( `String|Error|Object` ): A general error if the email already exists.

### `AuthApp.forgotPassword( email [, options], callback )`

Create a request to send a user forgot password mail.

This method make use of the `UserStore.checkUserEmail( email, options, callback )` and `UserStore.getMailContent( type, link, options, callback )` Methods.

####Arguments:

* **email** ( `String` ): The users email.
* **[options]** ( `String|Number|Object` - *optional* ): Options to be used inside the `UserStore.getMailContent` and `UserStore.checkUserEmail` method.
* **callback** ( `Function` ): The callback method.

#### Parameter for `callback( error )`

* **error** ( `String|Error|Object` ): A general error if somethis went wrong.

### `AuthApp.changeMail( current_email ,new_email [, options], callback )`

Create a request to to change an existing email.
The new email will get a Message with the token link. After a succesfull change the old emial will receice a notification message.

This method make use of the `UserStore.checkUserEmail( email, options, callback )`, `UserStore.setUserMail( current_email, new_email, callback )` and `UserStore.getMailContent( type, link, options, callback )` Methods.

####Arguments:

* **current_email** ( `String` ): The users email to find it in the db.
* **new_email** ( `String` ): The new email to activate.
* **[options]** ( `String|Number|Object` - *optional* ): Options to be used inside the `UserStore.getMailContent` and `UserStore.checkUserEmail` method.
* **callback** ( `Function` ): The callback method.

#### Parameter for `callback( error )`

* **error** ( `String|Error|Object` ): A general error if somethis went wrong.

### `AuthApp.getToken( token, callback )`

Check if a token exists.

####Arguments: 

* **token** ( `String` ): The token to read the data and .
* **callback** ( `Function` ): The callback method.

#### Parameter for `callback( error, email )`

* **error** ( `String|Error|Object` ): A general error if the token has not been found.

### `AuthApp.activate( token, password[, options], callback )`

Use an existing token and create a user.
This method make use of the `UserStore.setUserCredentials()` Method.

####Arguments:

* **token** ( `String` ): An existing token.
* **password** ( `String`  - *not relevant for `changeMail` token*  ): The plain password to be crypted and used to generate the user .
* **[options]** ( `String|Number|Object` - *optional* ): Options to be used inside the `UserStore.getMailContent` and `UserStore.checkUserEmail` method. 
* **callback** ( `Function` ): The callback method.

#### Parameter for `callback( error, userData, tokenData )`

* **error** ( `String|Error|Object` ): A general error object wich.
* **userData** ( `String|Number|Object` ): Additional data you can use after a successful activation. E.g. Data to create your session.
* **tokenData** ( `Object` ): Decoded token data.

# Events

### `connect`

Fired on the connect event of redis

### `disconnect`

Fired on a redis disconnection

### `error`

Fired on a redis general connection error

### `ready`

Fired until the module is ready to use.
Before redis has been connected and the the userStore has been checked.

### `login`

Fired after a succesfull login.

####Parameter:

* **userData** ( `String|Number|Object` ): Additional data you can use after a successful login. E.g. Data to create your session.

### `register` 

Fired after created a new `register` token.

####Parameter:

* **token** ( `String` ): The generated token.
* **email** ( `String` ): The receiver mail

### `forgot` 

Fired after created a new `forgot` token.

####Parameter:

* **token** ( `String` ): The generated token.
* **email** ( `String` ): The receiver mail

### `changemail` 

Fired after created a new `changemail` token.

####Parameter:

* **token** ( `String` ): The generated token.
* **current_email** ( `String` ): The users current email.
* **new_email** ( `String` ): The new email to activate.

### `activated` 

Fired after a token has been processed.

####Parameter:

* **token** ( `String` ): The processed token.
* **tokenData** ( `Object` ): The data of the token.
	* **type** ( `String` - *enum `register`, `forgot`, `changemail`* ): Token type
	* **email** ( `String` ): The requesting mail
	* **time** ( `Number` ): The creation timestamp in ms
	* **[newemail]** ( `String` - *optional* ): The mail to set for `type` = `changemail`.mail

### `mail`

Fired after a succesfull login.

####Parameter:

* **email** ( `String` ): The receiver mail
* **mailData** ( `Object` ): The data generated by the method `UserStore.getMailContent()`
	 

# User Store

### `UserStore.getUserCredentials( email, callback )`

Get the users password and session data by email

####Arguments:

* **email** ( `String` ): The email to find.
* **callback** ( `Function` ): The callback method.

#### Parameter for `callback( error, password, userData )`

* **error** ( `String|Error|Object` ): A general error object wich will be passed through the `login` Method.
* **password** ( `String` ): The password crypted by `bcrypt`.
* **userData** ( `String|Number|Object` ): Additional data you can use after a successful login to create your session.

### `UserStore.checkUserEmail( email, options, callback )`

Check if a email is existent in your database.

#### Arguments:

* **email** ( `String` ): The email to find.
* **options** ( `Any` ): The raw options data passed to `AuthApp.register()`, `AuthApp.forgot()` and `AuthApp.changeMail`. Intended to pass language data or other required information to your mail text generator.
* **callback** ( `Function` ): The callback method.

#### Parameter for `callback( error, exists )`

* **error** ( `String|Error|Object` ): A general error object wich will be passed through the calling Method.
* **exists** ( `Boolean` ): `true` if the email allready exists and `false` if not.

### `UserStore.setUserCredentials( email, passwordcypt, callback )`

Create a basic user with email and password.

#### Arguments:

* **email** ( `String` ): The email to create the user.
* **passwordcypt** ( `String` ): The password, crypted by "bcrypt" to create the user.
* **isRegister** ( `Boolean` ): Flag if it's a register call.
* **callback** ( `Function` ): The callback method.

#### Parameter for `callback( error, userData )`

* **error** ( `String|Error|Object` ): A general error object wich will be passed through the `activate` Method.
* **userData** ( `String|Number|Object` ): Additional data you can use after a successful login to create your session.

### `UserStore.setUserMail( current_email, new_email, callback )`

Change the email of a user by the current email.

#### Arguments:

* **current_email** ( `String` ): The users email to find it in the db.
* **new_email** ( `String` ): The new email to activate.
* **callback** ( `Function` ): The callback method.

#### Parameter for `callback( error, userData )`

* **error** ( `String|Error|Object` ): A general error object wich will be passed through the `activate` Method.
* **userData** ( `String|Number|Object` ): Additional data you can use after a successful login to create your session.


### `UserStore.getMailContent( type, token, options, callback )`

Get the content data for a mail.

#### Arguments:

* **type** ( `String` - *Enum[ `register`, `forgot`, `changemail`, `notifyoldmail` ]* ): The mail type. Can be a register mail, a password forgot mail, a chnage mail request or the notification to the old mail that the mail has been changed.
* **tokenOrNewmail** ( `String` ): The token generate your activation link in your Mail or for `type` = `notifyoldmail` the new setted mail.
* **options** ( `Any` ): The raw options data passed to `AuthApp.register()`. Intended to pass language data or other required information to your mail text generator.
* **callback** ( `Function` ): The callback method.

#### Parameter for `callback( error, contentData )`

* **error** ( `String|Error|Object` ): A general error object wich will be passed through the `activate` Method.
* **contentData** ( `Object` ): The a defined content object.
  * **subject** ( `String` ): The Mail subject.
  * **body** ( `String` ): The mail body witch has to contain the `link` unless the type is `notifyoldmail`. If not an error will be thrown. 
  * **sender** ( `String` - *optional*  ): The sender/reply mail address. 
  

## Release History
|Version|Date|Description|
|:--:|:--:|:--|
|v0.3.1|2013-11-21|Added options to `UserStore.checkUserEmail( email, options, callback )`|
|v0.3.0|2013-11-15|Deactivating mail service by setting `mailAppId = false`. Added `isRegister` argument to `UserStore.setUserCredentials`.|
|v0.2.2|2013-11-04|Bugfix for debuggin config and fixed `example.js` to a woking version|
|v0.2.1|2013-11-04|Fixed readme|
|v0.2.0|2013-10-31|Added `.changeMail()` Method|
|v0.1.0|2013-10-30|Initial commit|


## Related Projects
|Name|Description|
|:--|:--|
|[**tcs_node_mail_client**](https://github.com/mpneuried/tcs_mail_node_client)|Module to simply send mails by using the TCS mail Webservice (**node-tcs-de**)|


## The MIT License (MIT)

Copyright © 2013 Mathias Peter, http://www.tcs.de

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
