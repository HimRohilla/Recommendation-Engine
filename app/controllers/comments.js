var express = require('express');
var app = express();
var router = express.Router();
var constants = require(__path_to_app_utility_constants);
var functions = require(constants.path_to_app_utility + 'functions');
var models = require(constants.path_to_app_models);

router.post('/postComment', function(req, res) {
	var url = req.body.url;	// to find article_id
	var email = req.body.email;	// to find user_id
	models.findOne('publisher_articles', {'article_url': url}, ['article_id']).then(function(data) {
		return models.findOne('users', {'local_email': email}, ['user_id', 'photo', 'fullname'], {'article_id': data.article_id});
	}).then(function(data1) {
		console.log(data1);
		var user_id = data1.user_id;
		var article_id = data1.extra_properties.article_id;
		var date = req.body.date;
		console.log(date);
		var comment = req.body.comment;
		return models.save('publisher_article_comments', {'article_id': article_id, 'date_commented': date, 'comment_text': comment, 'user_id': user_id}, {'photo': data1.photo, 'fullname': data1.fullname});
	}).then(function(data2) {
		var json = {};
		json.success = true;
		json.user_photo = functions.checkPhotoForNull(data2.extra_properties.photo);
		json.fullname = data2.extra_properties.fullname;
		functions.sendResponse(res, json);
	}, function(err) {
		var json = {};
		json.success = false;
		json.error_message = "Sorry some error occured in posting comment";
		functions.sendResponse(res, json);
	});
})

module.exports = router;