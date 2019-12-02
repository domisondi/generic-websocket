var User = class User {
	constructor(id, types) {
		this.id = id;
		this.types = types;
	}
	
	includesType(type){
		var types = this.types || [];
		return types.includes(type);
	}
};

module.exports = User;