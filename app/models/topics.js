var constants = require(__path_to_app_utility_constants);
var db = require(constants.path_to_app_utility + 'db');
var con = db.getConnection();

	function checkAndInsertIntoTopics(topic_name) {
		return new Promise(function(resolve, reject) {
			con.query("SELECT topic_id FROM topics WHERE topic_name = ?", [topic_name], function(err, res) {
				var obj = {};
				if(err){
					reject(err);
				}
				if(res.length >= 1) {	// row already exists
					obj.topic_id = res[0].topic_id;
					return resolve(obj);
				}
				else {
					con.query("INSERT INTO topics SET ?", {topic_name: topic_name}, function(err1, res1) {
						if(err1){
							return reject(err1);
						}
						if(res1.insertId)
							obj.topic_id = res1.insertId;
						return resolve(obj);
					});
				}			
			});
		});
	}

	function getTopicsIdArray(topics_name_array, extra_properties) {
		return new Promise(function(resolve, reject) {
			var query = "SELECT topic_id FROM topics WHERE";
			for (var i = topics_name_array.length - 1; i >= 0; i--) {
				query += " topic_name = ? ";
				if(i != 0) {
					query += "OR";
				}
				topics_name_array[i] = topics_name_array[i].trim();
			}
			con.query(query, topics_name_array, function(err, res) {
				if(err) {
					reject(err);
				}
				var response = {};
				response.extra_properties = extra_properties;
				response.topic_array = res;
				resolve(response);
			});
		});
	}

module.exports = {
	checkAndInsertIntoTopics: checkAndInsertIntoTopics,
	getTopicsIdArray: getTopicsIdArray
}