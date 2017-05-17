//contains basic code for all models
var constants = require(__path_to_app_utility_constants);
var db = require(constants.path_to_app_utility + 'db');
var con = db.getConnection();

	/**
	*	table: table name for query
	*	json: all the `WHERE` properties (conditions)
	*	select_properties: all te `SELECT` parameters, which you want in your query result
	*
	*	RETURNS: set of selected parameters
	*/
	function findOne(table, json, select_properties, extra_properties) {
		return new Promise(function(resolve, reject) {
			var query;
			if(!select_properties) {
				query = "SELECT * FROM " + table + " WHERE ";
			}
			else {
				query = "SELECT ";
				for (var i = select_properties.length - 1; i >= 1; i--) {
					query += select_properties[i] + ', ';
				}
				query += select_properties[0] + ' FROM ' + table + ' WHERE ';
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
				var response = res[0];
				if(response)
					response.extra_properties = extra_properties;
				else
					response = {'extra_properties': extra_properties};
				resolve(response);
			});
		});
	}

	function findAll(table, json, select_properties, extra_properties) {
		return new Promise(function(resolve, reject) {
			var query;
			if(!select_properties) {
				query = "SELECT * FROM " + table + " WHERE ";
			}
			else {
				query = "SELECT ";
				for (var i = select_properties.length - 1; i >= 1; i--) {
					query += select_properties[i] + ', ';
				}
				query += select_properties[0] + ' FROM ' + table + ' WHERE ';
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
				var response = {'res_array': res};
				if(response.res_array){
					response.extra_properties = extra_properties;
				}
				else{
					response = {'extra_properties': extra_properties};
				}
				resolve(response);
			});
		});		
	}

	function save(table, user_json, extra_properties) {
		return new Promise(function(resolve, reject) {
			var query = "INSERT INTO " + table + " SET ?";
			con.query(query, user_json, function(err, res) {
				if(err)
					reject(err);

				resolve({'insertedId': res.insertId, 'extra_properties': extra_properties});
			})
		});
	}
	
	function update(table, update_set, update_where, extra_properties) {
		return new Promise(function(resolve, reject) {
			var query = "UPDATE " + table + " SET ";
			var array = [];
			var i;
			for (var key in update_set) {
				i = 0;
				if (update_set.hasOwnProperty(key)) {
					if(update_set[key] != null && update_set[key] != undefined) {
						query += key + ' = ? , ';
						array.push(update_set[key]);
					}
					else {
						query += key + ' = NULL , ';
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
				if(res)
					res.extra_properties = extra_properties;
				else
					res = {'extra_properties': extra_properties};
				resolve(res);
			})
		});
	}

module.exports = {
	findOne: findOne,
	findAll: findAll,
	save: save,
	update: update
}