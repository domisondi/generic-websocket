var request = require('request');

module.exports = function(url, data, callback){
    request.post({
        url: url,
        form: data
    }, (error, res, body) => {
        if (error) {
        	console.error(error);
        	return callback(null);
        }

        try {
            body = JSON.parse(body);
        } catch(ex) {}
        
        return callback(body);
    });
};