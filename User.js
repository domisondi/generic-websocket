const _ = require('underscore');

var User = class User {
	constructor(id, blogs) {
		this.id = id;
		this.blogs = _.map(blogs, b => b + ''); // make sure it is stored as strings
	}
	
	includesBlog(blog){
		var blogs = this.blogs || [];
		return blogs.includes(blog + ''); // compare as strings
	}
};

module.exports = User;