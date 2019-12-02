module.exports = {
	port: 8080,
	is_behind_proxy: true,
	socket_io: {path: '/websocket'},
	emit_event: 'relay',
	broadcast_route: '/websocket'
};