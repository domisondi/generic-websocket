const _ = require('underscore');

var User = class User {
	constructor(id, listeners) {
		this.id = id;
		this.listeners = listeners;
	}
	
	isListeningTo(type, value){
		// get the listeners of the type
		let listeners = this.listeners[type] || [];
		if(!_.isArray(listeners)) listeners = listeners.split(',');
		// make sure the listeners and value are treated as strings
		listeners = _.map(listeners, l => l + '');
		value = value + '';
		return _.contains(listeners, value);
	}
};

module.exports = User;