var constants = require(__path_to_app_utility_constants);
var db = require(constants.path_to_app_utility + 'db');
var con = db.getConnection();
var bcrypt   = require('bcrypt-nodejs');

	function findOne(json, select_properties) {
		return new Promise(function(resolve, reject) {
			var query;
			if(!select_properties) {
				query = "SELECT * FROM users WHERE ";
			}
			else {
				query = "SELECT ";
				for (var i = select_properties.length - 1; i >= 1; i--) {
					query += select_properties[i] + ', ';
				}
				query += select_properties[0] + ' FROM users WHERE ';
			}
			var array = [];
			var i = 0;
			for (var key in json) {
				if (json.hasOwnProperty(key)) {
					if(json[key] != null) {
						query += key + ' = ? AND ';
						array.push(json[key]);
					}
					else {
						query += key + ' IS NULL AND ';
					}
				}
			}
			query = query.substring(0, query.length-4);
			con.query(query, array, function(err, res) {
				if(err)
					reject(err);

				resolve(res[0]);
			});
		});
	}

	function save(user_json) {
		return new Promise(function(resolve, reject) {
			var query = "INSERT INTO users SET ?";
			var q = con.query(query, user_json, function(err, res) {
				console.log(q.sql);
				if(err)
					reject(err);

				resolve({'insertedId': res.insertId});
			})
		});
	}

	function update(update_set, update_where) {
		return new Promise(function(resolve, reject) {
			var query = "UPDATE users SET ";
			var array = [];
			var i;
			for (var key in update_set) {
				i = 0;
				if (update_set.hasOwnProperty(key)) {
					if(update_set[key] != null) {
						query += key + ' = ? , ';
						array.push(update_set[key]);
					}
					else {
						query += key + ' IS NULL';
					}
				}
			}
			query = query.substring(0, query.length-2);
			query += " WHERE ";
			for (var key in update_where) {
				i = 0;
				if (update_where.hasOwnProperty(key)) {
					if(update_where[key] != null) {
						query += key + ' = ? AND ';
						array.push(update_where[key]);
					}
					else {
						query += key + ' IS NULL AND ';
					}
				}

			}
			query = query.substring(0, query.length-4);
			con.query(query, array, function(err, res) {
				if(err)
					reject(err);

				resolve(res);
			})
		});
	}

	function generateHash(password) {
		return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
	}

	function validPassword(enteredPassword, savedPassword) {
		return bcrypt.compareSync(enteredPassword, savedPassword);
	}
	// saveTempUser: function() {
	// 	return new Promise(function(resolve, reject) {
	// 		var user = {};
	// 		var facebook_info = {};
	// 		facebook_info.name = "hiamsnhu rohilla";
	// 		facebook_info.token = "dankdbafbwekrhb21kjkrb3471397heknaknda";
	// 		facebook_info.email = "ruhela.hiamsnhu@gmail.com";
	// 		user.facebook_info = JSON.stringify(facebook_info);
	// 		user.local_email = 'hii-3';
	// 		require('./users').save(user).then(function(res) {
	// 			resolve('user saved');
	// 		}, function(err) {
	// 			reject('error');
	// 		});			
	// 	})
	// },
	// getTempUser: function() {
	// 	console.log("called");
	// 	require('./users').findOne({user_id: 12}, ['facebook_info']).then(function(res) {
	// 		console.log('entered');
	// 		console.log(res);
	// 		var facebook_info = JSON.parse(res.facebook_info);
	// 		console.log(facebook_info.email);
	// 	}, function(err) {
	// 			console.log('failed');
	// 	});
	// }
module.exports = {
	findOne: findOne,
	save: save,
	update: update,
	generateHash: generateHash,
	validPassword: validPassword
}