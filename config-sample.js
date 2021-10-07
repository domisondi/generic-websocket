module.exports = {
	port: 11808,
	is_behind_proxy: true,
	socket_io: {path: '/websocket'},
	emit_event: 'relay',
	broadcast_route: '/websocket',
	allowed_broadcast_ips: ["127.0.0.1", "::1", "::ffff:127.0.0.1", "192.168.123.5", "::ffff:192.168.123.5"],
	auth_cookie_full: false,
	auth_cookie: 'wordpress_logged_in_',
	auth_url: 'tramp/v1/socket-validate-cookie',
	auth_full_url: false,
        api_url: '/wp-json/'
};