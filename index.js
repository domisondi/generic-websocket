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
app.get(config.broadcast_route, function(req, res){
	res.end('hello world');
});

// on new connection
io.on('connection', function(socket){
	// get id
	var id = socket.handshake.query['user_id'] || '';
	
	// get blogs
	var blogs = socket.handshake.query['blogs'];
	if(blogs && !_.isArray(blogs)) blogs = blogs.split(',');
	else blogs = [];
	
	// create new user object
	var user = new User(id, blogs);
	
	// create new connection object
	var connection = new Connection(socket, user);
	
	// add to connections array
	connections.push(connection);
		
	// log new connection
	console.log('new connection: ' + (id ? id : 'anonymous') + ', blogs: ' + blogs.join(';'));
		
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

// start the service
server.listen(port, function(){
	console.log('Listening on *:' + port);
});