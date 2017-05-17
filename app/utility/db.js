var constants = require('./constants');
var mysql = require('mysql');
var con;
module.exports = {
	getConnection: function () {
		if (con) return con;
		con = mysql.createConnection({
			host     : constants.host,
			user     : constants.username,
			password : constants.password,
			database : constants.db_name
		});
		return con;
	}
}