var express = require('express');
var app = express();
var router = express.Router();
var constants = require(__path_to_app_utility_constants);
var functions = require(constants.path_to_app_utility + 'functions');
var models = require(constants.path_to_app_models);

router.post('/saveReaction', function(req, res) {
	var email = req.body.email;
	var url = req.body.url;
	var reaction_name = req.body.reaction_name;
	models.findOne('users', {'local_email': email}, ['user_id']).then(function(data) {
		return models.findOne('publisher_articles', {'article_url': url}, ['article_id'], {'user_id': data.user_id});
	}).then(function(data2) {
		return models.findOne('reactions', {'reaction_name': reaction_name}, ['reaction_id'], {'user_id': data2.extra_properties.user_id, 'article_id': data2.article_id});
	}).then(function(data3) {
		return models.findOne('publisher_article_reactions', {'article_id': data3.extra_properties.article_id, 'user_id': data3.extra_properties.user_id}, ["reaction_id"], {'user_id': data3.extra_properties.user_id, 'article_id': data3.extra_properties.article_id, 'new_reaction_id': data3.reaction_id});
	}).then(function(data4) {
		if(!data4.reaction_id) {	// save new
			return models.save('publisher_article_reactions', {'article_id': data4.extra_properties.article_id, 'user_id': data4.extra_properties.user_id, 'reaction_id': data4.extra_properties.new_reaction_id});			
		}
		else {	// update existing
			return models.update('publisher_article_reactions', {'reaction_id': data4.extra_properties.new_reaction_id}, {'article_id': data4.extra_properties.article_id, 'user_id': data4.extra_properties.user_id}, {'old_reaction_id': data4.reaction_id});
		}
	}).then(function(data6) {
		return models.findOne('reactions', {'reaction_id': data6.extra_properties.old_reaction_id}, ['reaction_name']);
	}).then(function(data5) {
		var json = {};
		json.success = true;
		json.old_reaction_name = data5.reaction_name;
		functions.sendResponse(res, json);
	}, function(err) {
		var json = {};
		json.success = false;		
		functions.sendResponse(res, json);
	});
});

module.exports = router;