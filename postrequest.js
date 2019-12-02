var request = require('request');

module.exports = function(url, data, callback){
	request.post(url, {
  		json: data
	}, (error, res, body) => {
  		if (error) {
    		return callback(null);
  		}
  		return callback(JSON.parse(body));
	});
}