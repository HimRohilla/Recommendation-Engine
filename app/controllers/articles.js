var express = require('express');
var app = express();
var router = express.Router();
var constants = require(__path_to_app_utility_constants);
var functions = require(constants.path_to_app_utility + 'functions');
var articles = require(constants.path_to_app_models + 'articles');
var publishers = require(constants.path_to_app_models + 'publishers');
var topics = require(constants.path_to_app_models + 'topics');
var request = require('ajax-request');

router.get('/', function(req, res) {
	console.log("get / in articles.js");
	functions.mergeTopics(17, "http://localhost/RecommendationEngineBlog.html").then(function(response) {
		// getting top N entries from array
		if(response.success) {
			var topNTopicsArray = response.mergedTopicsArray.slice(0, 2*constants.max_num_of_recommended_articles);
			return functions.getArticlesFromTopicsArray(topNTopicsArray, "abcd");
		}
		else {
			// array not found display error in widget
		}
	}).then(function(topArticlesArray) {
		topNArticlesArray = topArticlesArray.slice(0, constants.max_num_of_recommended_articles);
	});
	res.end();
});

// saves the article and article related topics for a particular publisher
router.get('/saveArticle', function(req, res) {
	url = req.query.url;
	id = req.query.id;	// unique id assigned to a publisher
	request({
		url: url,
		method: 'GET'
	}, function(err, res1, body) {
		var finalJSON = fillFinalJson(req.user);
		functions.insertIntoPublisherAndArticlesAndTopics(err, body, url, id).then(function(obj) {

			// make array ['likes' => array of articles, 'dislikes' => array of articles here]

			var topicsArray = functions.getMetaTagTopicsImageTitle(body).topicsArray;
			functions.searchForArticles(topicsArray, id).then(function(finalArray) {
				finalJSON.articles_array = finalArray;
				if(obj.status) {
					article_id = obj.article_id;
					functions.getReactionsOnArticle(article_id).then(function(reaction_data) {
						finalJSON.reaction_data = reaction_data;
						articles.getCommentsFromPublisherArticleComments(article_id).then(function(comments_rows) {
							finalJSON.comments_data = comments_rows;
							functions.sendResponse(res, finalJSON);
						}, function(err_2) {
							finalJSON.reaction_data = {};
							finalJSON.comments_data = {};
							finalJSON.error_message = "Sorry some error occured";
							functions.sendResponse(res, finalJSON);						
						});
					}, function(err_1) {
						finalJSON.reaction_data = {};
						finalJSON.comments_data = {};
						finalJSON.error_message = "Sorry some error occured";
						functions.sendResponse(res, finalJSON);
					});
				}
				else {
					finalJSON.reaction_data = {};
					finalJSON.comments_data = {};
					finalJSON.error_message = "publisher is not registered";
					functions.sendResponse(res, finalJSON);
				}
			});
		}, function(err) {
			finalJSON.reaction_data = {};
			finalJSON.comments_data = {};
			finalJSON.error_message = "publisher is not registered";
			functions.sendResponse(res, finalJSON);
		})
	});
});

function fillFinalJson(user) {
	var finalJSON = {};
	finalJSON.user_logged_in = false;
	if(user) {
		finalJSON.user_logged_in = true;
		finalJSON.user_details = user;
	}
	finalJSON.emoticons_base_path = constants.emoticons_base_path;
	finalJSON.users_images_base_path = constants.users_images_base_path;
	finalJSON.article_images_base_path = constants.article_images_base_path;
	finalJSON.emoticons_extension = constants.emoticons_extension;
	return finalJSON;
}

module.exports = router;