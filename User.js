var User = class User {
	constructor(id, blogs) {
		this.id = id;
		this.blogs = blogs;
	}
	
	includesBlog(blog){
		var blogs = this.blogs || [];
		return blogs.includes(blog);
	}
};

module.exports = User;