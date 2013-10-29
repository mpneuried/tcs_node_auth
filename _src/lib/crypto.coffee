crypto = require( "crypto" )

module.exports = ( algorithm = "aes128", enc_in = "utf8", enc_out = "hex", padding = true )->
	_ret = 
		crypt: ( key, str )->
			cipher = crypto.createCipher( algorithm, new Buffer( key ) )
			cipher.setAutoPadding( padding )
			_cipher = cipher.update( str, enc_in, enc_out )
			_cipher += cipher.final( enc_out )
			return _cipher

		decrypt: ( key, crypted )->
			decipher = crypto.createDecipher( algorithm, new Buffer( key ) )
			decipher.setAutoPadding( padding )
			_decipher = decipher.update( crypted, enc_out, enc_in )
			_decipher += decipher.final( enc_in )
			return _decipher

	return _ret