node-basex-rest
===============

BaseX REST Client for nodejs

Uses [q](https://github.com/kriskowal/q) promise objects.

Usage:

```javascript
var BaseXRest = require('basex-rest');

var client = new BaseXRest({
	user: 'admin',
	pass: 'admin',
	host: 'localhost'
	port: 8984,
	path: '/webdav'
})


client.command('INFO')
	.then(function(response){
		console.log(response)
	})
	.fail(function(error){
		throw error
	})

client.query('for $i in 1 to 10 return $i')
	.then(function(response){
		console.log(response)
	})


```