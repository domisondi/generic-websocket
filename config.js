module.exports = {
	port: 8080,
	is_behind_proxy: true,
	socket_io: {path: '/websocket'},
	emit_event: 'relay',
	broadcast_route: '/websocket',
	allowed_broadcast_ips: ["127.0.0.1", "::1", "::ffff:127.0.0.1", "192.168.123.5", "::ffff:192.168.123.5"]
};