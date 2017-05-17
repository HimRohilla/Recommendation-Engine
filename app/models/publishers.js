var constants = require(__path_to_app_utility_constants);
var db = require(constants.path_to_app_utility + 'db');
var con = db.getConnection();

	function checkIfPublisherExists(publisher_id) {
		return new Promise(function(resolve, reject) {
			con.query("SELECT * FROM publishers WHERE publisher_id = ?", [publisher_id], function(err, res) {
				if(err)
					return reject(err);
				if(res.length >= 1) {
					return resolve(true);
				}
				return resolve(false);
			});
		});
	}

	function getAllDomainNames() {
		return new Promise(function(resolve, reject) {
			con.query("SELECT domain_name FROM publishers", [], function(err, res) {
				if(err)
					return reject(err);
				return resolve(res);
			});
		});
	}
module.exports = {
	checkIfPublisherExists: checkIfPublisherExists,
	getAllDomainNames: getAllDomainNames
}