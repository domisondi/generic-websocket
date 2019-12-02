// load dependencies
var express = require('express');
var cookie = require('cookie');
var _ = require('underscore');
var postrequest = require('./postrequest.js');

// load the config
var config = require('./config.js');

// load all classes
var Connection = require('./Connection');
var User = require('./User');

// create the http and websocket server
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http, config.socket_io);
var port = process.env.PORT || config.port;
app.use(express.json());

// is behind a proxy?
if(config.is_behind_proxy) app.enable('trust proxy');

// all connections
var connections = [];

// server broadcast route
app.post(config.broadcast_route, function(req, res){
	// check if request comes from an allowed ip
	if(!config.allowed_broadcast_ips.includes(req.connection.remoteAddress)) {
		return res.end();
	}

	// get the data
	var data = req.body;

	// broadcast to all connections
	connections.forEach(connection => {
		// check if data.type is contained in the users allowed types
		if(connection.includesType(data.type)){
			connection.send(config.emit_event, data.content);
		}
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
		return config.auth_cookie_full ? name === config.auth_cookie : name.startsWith(config.auth_cookie);
	});
	
	// get id and allowed message types
	postrequest(config.auth_url, {cookie: auth_cookie}, result => {
		// get id
		var id = result.id;
	
		// get types
		var types = result.types;
	
		// create new user object
		var user = new User(id, types);

		// create new connection object
		var connection = new Connection(socket, user);
	
		// add to connections array
		connections.push(connection);
	});
	
	// handle disconnect
	socket.on('disconnect', () => {
		// remove the connection
		var index = connections.indexOf(connection);
		if(index > -1) connections.splice(index, 1);
	});
});

// start the service
http.listen(port, function(){
	console.log('Listening on *:' + port);
});
