var constants = require(__path_to_app_utility_constants);
var db = require(constants.path_to_app_utility + 'db');
var model = require(constants.path_to_app_models);
var con = db.getConnection();

	function checkThenInsertIntoPublisherArticles(publisher_id, article_title, article_image_url, article_url) {
		valueSet = {
			publisher_id: publisher_id,
			article_title: article_title,
			article_url: article_url,
			article_image: article_image_url
		};
		return new Promise(function(resolve, reject) {
			con.query("SELECT article_id FROM publisher_articles WHERE publisher_id = ? AND article_url = ?", [publisher_id, article_url], function(err, res) {
				var obj = {};
				if(err){
					reject(err);
				}
				if(res.length >= 1) {	// row already exists
					obj.status = true;
					obj.article_id = res[0].article_id;
					model.update("publisher_articles", {'article_title': article_title, 'article_image': article_image_url}, {'publisher_id': publisher_id, 'article_url': article_url}).then(function(res1) {
						resolve(obj);
					}, function(err) {
						reject(err);
					});
				}
				else {
					con.query("INSERT INTO publisher_articles SET ?", valueSet, function(err1, res1) {
						if(err1){
							reject(err1);
						}
						obj.status = false;
						if(res1 === undefined) {
							reject(err1);
						}
						obj.article_id = res1.insertId;
						resolve(obj);
					});
				}
			});
		});
	}
	
	function insertIntoPublisherArticleTopics(article_id, topic_id) {
		valueSet = {
			article_id: article_id,
			topic_id: topic_id
		};
		con.query("INSERT INTO publisher_article_topics SET ?", valueSet, function(err, res) {
			if(err){
				// error in insertion
			}
		});
	}

	function getCommentsFromPublisherArticleComments(article_id) {
		return new Promise(function(resolve, reject) {
			con.query("SELECT publisher_article_comments.comment_text, publisher_article_comments.date_commented, users.fullname, photo FROM publisher_article_comments, users WHERE publisher_article_comments.user_id = users.user_id AND publisher_article_comments.article_id = ?", [article_id], function(err, res) {
				if(err)
					return reject(err);
				for (var i = res.length - 1; i >= 0; i--) {
					if(res[i].photo == null) {
						res[i].photo = constants.default_image_name;
					}
				}
				return resolve(res);
			});
		});
	}

	function getArticlesFromTopics(topic_array, publisher_id) {
		return new Promise(function(resolve, reject) {
			var query = "SELECT publisher_articles.article_url, publisher_articles.article_image, publisher_articles.article_title FROM publisher_articles, publisher_article_topics WHERE (";
			for (var i = topic_array.length - 1; i >= 0; i--) {
				query += " publisher_article_topics.topic_id = " + topic_array[i].id;
				if(i != 0) {
					query += " OR ";
				}
			}
			query += " ) AND publisher_articles.publisher_id = '" + publisher_id + "' AND publisher_articles.article_id = publisher_article_topics.article_id";
			con.query(query, [], function(err, res) {
				if(err) {
					reject(err);
				}
				resolve(res);
			})
		});
	}

	function getAllArticlesRelatedToPublishers(publisher_id) {
		return new Promise(function(resolve, reject) {
			var query = "SELECT article_url, article_image, article_title FROM publisher_articles WHERE publisher_id = ?";
			con.query(query, [publisher_id], function(err, res) {
				if(err) {
					reject(err);
				}
				resolve(res);
			})
		});
	}

	function getArticlesBasedOnTopics(topicsArray, publisher_id) {
		return new Promise(function(resolve, reject) {
			var query = "SELECT DISTINCT article_title, article_url, article_image FROM publisher_articles, publisher_article_topics, topics WHERE publisher_articles.publisher_id = ? AND publisher_articles.article_id = publisher_article_topics.article_id AND (";
			var array = [];
			array[0] = publisher_id;
			for (var i = topicsArray.length - 1; i >= 0; i--) {
				query += "topics.topic_name = ?";
				if(i > 0) {
					query += " OR ";
				}
				array[topicsArray.length - i] = topicsArray[i].trim();
			}
			query += ") AND topics.topic_id = publisher_article_topics.topic_id";
			var sq = con.query(query, array, function(err, res) {
				// console.log(sq.sql);
				if(err)
					reject(err);
				resolve(res);
			})
		});
	}

	function getArticlesNotBasedOnTopics(topicsArray, publisher_id) {
		return new Promise(function(resolve, reject) {
			var query = "SELECT DISTINCT article_title, article_url, article_image FROM publisher_articles, publisher_article_topics, topics WHERE publisher_articles.publisher_id = ? AND publisher_articles.article_id = publisher_article_topics.article_id AND (";
			var array = [];
			array[0] = publisher_id;
			for (var i = topicsArray.length - 1; i >= 0; i--) {
				query += "topics.topic_name != ?";
				if(i > 0) {
					query += " AND ";
				}
				array[topicsArray.length - i] = topicsArray[i].trim();
			}
			query += ") AND topics.topic_id = publisher_article_topics.topic_id";
			var sq = con.query(query, array, function(err, res) {
				// console.log(sq.sql);
				if(err)
					reject(err);
				resolve(res);
			})
		});
	}	

module.exports = {
	checkThenInsertIntoPublisherArticles: checkThenInsertIntoPublisherArticles,
	insertIntoPublisherArticleTopics: insertIntoPublisherArticleTopics,
	getCommentsFromPublisherArticleComments: getCommentsFromPublisherArticleComments,
	getArticlesFromTopics: getArticlesFromTopics,
	getArticlesBasedOnTopics: getArticlesBasedOnTopics,
	getArticlesNotBasedOnTopics: getArticlesNotBasedOnTopics
}