var Connection = class Connection {
	constructor(socket, user) {
		this.socket = socket;
		this.user = user;
		this.initialize();
	}
	
	// initialize the connection
	initialize() {
		
	}
	
	includesType(type) {
		return this.user.includesType(type);
	}
	
	send(event, data){
		return this.socket.emit(event, data);
	}
};

module.exports = Connection;