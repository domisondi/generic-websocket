(async () => {
	// load dependencies
	const express = require('express');
	const _ = require('underscore');
	const fs = require('fs');
	const persistent = require('node-persist');

	// load the config
	const config = require('./config.js');

	// load the sqlite database
	const storage = persistent.create({dir: config.storage_path});
	await storage.init();

	// load all classes
	const Connection = require('./Connection');
	const User = require('./User');

	// set the port
	config.port = process.env.PORT || config.port;

	// create the http and websocket server
	const app = express();
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

	// cors
	if(config.allow_origin) {
		app.all('*', function(req, res, next) {
			res.header("Access-Control-Allow-Origin", config.allow_origin);
			res.header("Access-Control-Allow-Headers", '*');
			res.header("Access-Control-Allow-Credentials", 'false');
			next();
		});
	}

	// setup websocket
	const io = require('socket.io')(server, config.socket_io);
	const port = config.port;
	app.use(express.json({limit: '100mb'}));

	// is behind a proxy?
	if(config.is_behind_proxy) app.enable('trust proxy');

	// all connections
	const connections = [];

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
		
		// get listeners
		var listeners = socket.handshake.query['listeners'];
		try {
			listeners = JSON.parse(listeners);
		} catch(err){
			listeners = {};
		}
		if(!_.isObject(listeners)) listeners = {};
		
		// create new user object
		var user = new User(id, listeners);
		
		// create new connection object
		var connection = new Connection(socket, user);
		
		// add to connections array
		connections.push(connection);
			
		// log new connection
		console.log('new connection: ' + (id ? id : 'anonymous') + ', listeners: ' + JSON.stringify(listeners));
			
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


	/*********************************************/
	/*			     web push api				 */
	/*********************************************/
	const webPush = require("web-push");

	if (!config.VAPID_PUBLIC_KEY || !config.VAPID_PRIVATE_KEY) {
		console.log(
			"You must set the VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY " +
			"config variables. You can use the following ones:",
		);
		console.log(webPush.generateVAPIDKeys());
		return;
	}

	webPush.setVapidDetails(
		config.VAPID_CONTACT,
		config.VAPID_PUBLIC_KEY,
		config.VAPID_PRIVATE_KEY,
	);

	app.post("/webpush/save-subscription", async (req, res) => {
		// get subscriptions from store
		let subscriptions = await storage.getItem('subscriptions');
		if(!subscriptions) subscriptions = [];
		// check if there is a subscription that has the same endpoint already
		let data = req.body;
		let subscription = _.find(subscriptions, s => s.endpoint === data.subscription.endpoint);
		if(!subscription) subscription = data.subscription;
		// update the filters
		subscription.filters = data.filters;
		// push to the global array
		subscriptions.push(subscription);
		// make subscriptions unique, and only keep the ones with filter
		subscriptions = _.unique(_.filter(subscriptions, sub => !_.isEmpty(sub.filters)), false, sub => sub.endpoint);
		await storage.setItem('subscriptions', subscriptions);
		return res.end();
	});

	app.post("/webpush/send-notification", async (req, res) => {
		// check if request comes from an allowed ip
		if(!config.allowed_broadcast_ips.includes(req.connection.remoteAddress)) {
			// not allowed
			console.log('Sending push notifications not allowed from ' + req.connection.remoteAddress);
			return res.end();
		}

		// get the data
		let data = req.body || '';

		// check if the data has the correct format
		if(!data || !data.filter || !data.title || !data.message) {
			console.log('Invalid push notification data');
			return res.end();
		}

		console.log('Push notification: ', data);

		// get all subscriptions and run through all of them
		let subscriptions = await storage.getItem('subscriptions');
		let updatedSubscriptions = [];
		await Promise.all(_.map(subscriptions, async sub => {
			// get the filters
			let filters = sub.filters;
			
			let subValid = true;
			try {
				// check if any filter matches
				if(!_.any(filters, f => _.isEqual(f, data.filter))) return;
				// send the notification
				await webPush.sendNotification(sub, JSON.stringify({
					title: data.title,
					message: data.message,
					url: data.url || ''
				}));
			} catch(err){
				// depending on the error unsubscribe the user
				if(err.statusCode === 410) {
					subValid = false;
				}
				else {
					console.error(err);
				}
			} finally {
				if(subValid) updatedSubscriptions.push(sub);
			}
		}));
		await storage.setItem('subscriptions', updatedSubscriptions);
		res.end();
	});
})();