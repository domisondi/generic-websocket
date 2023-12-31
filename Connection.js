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
		return (data.blog_id && (data.blog_id === true || this.user.includesBlog(data.blog_id))) || //
		   	   (data.socket_id && data.socket_id === this.socket.id) ||
		   	   (data.user_id && data.user_id === this.user.id);
	}
	
	send(event, data){
		return this.socket.emit(event, data);
	}
};

module.exports = Connection;