var Connection = class Connection {
	constructor(socket, user) {
		this.socket = socket;
		this.user = user;
		this.initialize();
	}
	
	// initialize the connection
	initialize() {
		
	}
	
	checkSend(data){
		return (data.listener && (data.listener === true || this.user.includesBlog(data.listener.type, data.listener.value))) ||
		   	   (data.socket_id && data.socket_id === this.socket.id) ||
		   	   (data.user_id && data.user_id === this.user.id);
	}
	
	send(event, data){
		return this.socket.emit(event, data);
	}
};

module.exports = Connection;