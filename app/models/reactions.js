var constants = require(__path_to_app_utility_constants);
var db = require(constants.path_to_app_utility + 'db');
var con = db.getConnection();

	function getReactionsCountOnArticle(article_id) {	// returns count of each reaction on an article
		return new Promise(function(resolve, reject) {
			con.query("SELECT count(*) as count, publisher_article_reactions.reaction_id, reactions.reaction_name FROM publisher_article_reactions, reactions WHERE reactions.reaction_id = publisher_article_reactions.reaction_id AND publisher_article_reactions.article_id = ? GROUP BY reaction_id", [article_id], function(err, res) {
				if(err)
					reject(err);
				return resolve(res);
			});
		});
	}

	function getAllReactions() {
		return new Promise(function(resolve, reject) {
			con.query("SELECT reaction_id, reaction_name FROM reactions ORDER BY reaction_id", [], function(err, res) {
				if(err)
					reject(err);
				return resolve(res);
			});			
		});
	}

module.exports = {
	getReactionsCountOnArticle: getReactionsCountOnArticle,
	getAllReactions: getAllReactions
}
