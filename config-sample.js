module.exports = {
	port: 8080,
	ssl_cert: '',
	ssl_key: '',
	is_behind_proxy: true,
	storage_path: 'websocket_storage',
	socket_io: {
		path: '/websocket',
		pingTimeout: 60000,
		cors: {
			origin: '*',
			credentials: false
		}
	},
	emit_event: 'relay',
	broadcast_route: '/websocket',
	allowed_broadcast_ips: ["127.0.0.1", "::1", "::ffff:127.0.0.1", "192.168.123.5", "::ffff:192.168.123.5"],
    allow_origin: '*',
	VAPID_PUBLIC_KEY: '',
	VAPID_PRIVATE_KEY: '',
	VAPID_CONTACT: 'https://example.com'
};