var request = require('request');

module.exports = function(url, data, callback){
	request.post(url, {
  		formData: data
	}, (error, res, body) => {
  		if (error) {
    		return callback(null);
  		}
  		
  		try {
  			body = JSON.parse(body);
  		} catch(ex) {}
  		return callback();
	});
}