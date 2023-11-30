// load dependencies
var express = require('express');
var cookie = require('cookie');
var _ = require('underscore');
var fs = require('fs');
var postrequest = require('./postrequest.js');

// load the config
var config = require('./config.js');

// load all classes
var Connection = require('./Connection');
var User = require('./User');

// set the port
config.port = process.env.PORT || config.port;

// log the config
console.log(config);

// create the http and websocket server
var app = express();
var server; 
if(config.ssl_cert && config.ssl_key) {
	server = require('https').createServer({
		key: fs.readFileSync(config.ssl_key),
        cert: fs.readFileSync(config.ssl_cert),
	}, app);
}
else {
	server = require('http').Server(app);
}
var io = require('socket.io')(server, config.socket_io);
var port = config.port;
app.use(express.json({limit: '100mb'}));

// cors
if(config.allow_origin) {
	app.all('*', function(req, res, next) {
    	res.header("Access-Control-Allow-Origin", config.allow_origin);
        next();
    });
}

// is behind a proxy?
if(config.is_behind_proxy) app.enable('trust proxy');

// all connections
var connections = [];

// server broadcast route
app.post(config.broadcast_route, function(req, res){
	// check if request comes from an allowed ip
	if(!config.allowed_broadcast_ips.includes(req.connection.remoteAddress)) {
		// not allowed
		console.log('Broadcast not allowed from ' + req.connection.remoteAddress);
		return res.end();
	}

	// get the data
	var data = req.body;

	// log the broadcast
	console.log('Broadcasting: ', data);

	// broadcast to all connections
	connections.forEach(connection => {
		if(connection.checkSend(data)) connection.send(config.emit_event, data.content);
	});
		
	// send empty response
	res.end();
});

// on new connection
io.on('connection', function(socket){
	// authenticate with the cookie
	var all_cookies = cookie.parse(socket.handshake.headers.cookie || '');
	
	// get auth cookie
	var auth_cookie = _.find(all_cookies, (c, name) => {
		let possibleCookies = config.auth_cookie;
		if(!_.isArray(possibleCookies)) possibleCookies = [possibleCookies];
		return _.any(possibleCookies, posC => {
			return config.auth_cookie_full ? name === posC : name.startsWith(posC);
		});
	});

	// log new connection
	console.log('connection: ', auth_cookie ? "logged in" : "anonymous");
	
	// get id
	var scheme = socket.handshake.secure ? 'https' : (socket.handshake.headers['x-forwarded-scheme'] || 'http');
	var auth_url = config.auth_full_url ? config.auth_url : (scheme + '://' + socket.handshake.headers.host + config.api_url + config.auth_url);
	postrequest(auth_url, {cookie: auth_cookie}, result => {
		// check result
		if(!result) return socket.disconnect();
	
		// get id
		var id = result.id;
	
		// get blogs
		var blogs = socket.handshake.query['blogs'];
		if(blogs && !_.isArray(blogs)) blogs = blogs.split(',');
		else blogs = [];
	
		// create new user object
		var user = new User(id, blogs);

		// log the user
		console.log('user: ', user);

		// create new connection object
		var connection = new Connection(socket, user);
	
		// add to connections array
		connections.push(connection);
		
		// handle disconnect
		socket.on('disconnect', () => {
			// remove the connection
			var index = connections.indexOf(connection);
			if(index > -1) connections.splice(index, 1);
		});
                
                // handle client initiated event
                socket.on(config.emit_event, function(data, callback){
                    
                });
	});
});

// start the service
server.listen(port, function(){
	console.log('Listening on *:' + port);
});