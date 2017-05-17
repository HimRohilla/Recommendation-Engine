var uuid = require('node-uuid');
var htmlparser = require("htmlparser2");
var constants = require(__path_to_app_utility_constants);
var articles = require(constants.path_to_app_models + 'articles');
var topics = require(constants.path_to_app_models + 'topics');
var publishers = require(constants.path_to_app_models + 'publishers');
var reactions = require(constants.path_to_app_models + 'reactions');
var models = require(constants.path_to_app_models);
var request = require('ajax-request');

	function getUniqueId() {
		uuidDash = uuid.v1();
		return uuidDash.replace(/-/g, "");
	}

	function sendResponse(res, json) {
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.write(JSON.stringify(json));
		res.end();
	}

	function getMetaTagTopicsImageTitle(body) {
		var title, image_url, topicsArray;
		var parser = new htmlparser.Parser({
		    onopentag: function(name, attribs){
		        if(name === "meta" && attribs.name === "og:title"){
					title = attribs.content;
		        }
		        else if(name === "meta" && attribs.name === "keywords") {
		        	topicsArray = attribs.content.split(",");
		        }
		        else if(name === "meta" && attribs.name === "og:image") {
		        	image_url = attribs.content;
		        }
		    },
		    ontext: function(text){
		    },
		    onclosetag: function(tagname){
		    }
		}, {decodeEntities: true});
		parser.write(body);
		parser.end();
		return {'topicsArray': topicsArray, 'title': title, 'image_url': image_url};
	}

	function insertIntoPublisherAndArticlesAndTopics(err, body, url, id) {
		return new Promise(function(resolve, reject) {
			var arr = getMetaTagTopicsImageTitle(body);
			var topicsArray = arr.topicsArray;
			var image_url = arr.image_url
			var title = arr.title;
			// first check whether that particular publisher is there in db or not
			publishers.checkIfPublisherExists(id).then(function(status) {
				if(status) {
					articles.checkThenInsertIntoPublisherArticles(id, title, image_url, url).then(function(obj) {
						var article_id = obj.article_id;
						if(!obj.status) {
							for (var i = topicsArray.length - 1; i >= 0; i--) {
								topics.checkAndInsertIntoTopics(topicsArray[i].trim()).then(function(obj1) {
									articles.insertIntoPublisherArticleTopics(article_id, obj1.topic_id);
								}, function(err1) {
									reject(err1);
								});
							}
						}
						var obj = {status: true, article_id: article_id};
						return resolve(obj);
					}, function(err) {
						reject(err);
					});
				}
				else {
					var obj = {status: false}
					return resolve(obj);
				}
			}, function(err) {
				reject(err);
			});			
		})
	}

	function getReactionsOnArticle(article_id) {	// get all reactions on a particular article
		return new Promise(function(resolve, reject) {
			reactions.getReactionsCountOnArticle(article_id).then(function(rows) {
				reactions.getAllReactions().then(function(total_reaction_rows) {
					reaction_data = getFinalReactionsIncludingZero(rows, total_reaction_rows);
					return resolve(reaction_data);
				}, function(err_1) {
					return reject(err_1);
				});
			}, function(err) {
				return reject(err);
			});
		});
	}

	function getFinalReactionsIncludingZero(rows, total_reaction_rows) {
		var max_reaction_name = "";
		var max = 0;
		for (var i = total_reaction_rows.length - 1; i >= 0; i--) {
			for (var j = rows.length - 1; j >= 0; j--) {
				if(total_reaction_rows[i].reaction_id == rows[j].reaction_id) {
					break;
				}
			}
			if(j == -1) {
				rows.push({count: 0, reaction_id: total_reaction_rows[i].reaction_id, reaction_name: total_reaction_rows[i].reaction_name});
			}
		}
		sortByKey(rows, 'reaction_id');
		for (var j = rows.length - 1; j >= 0; j--) {
			if(rows[j].count > max) {
				max = rows[j].count;
				max_reaction_name = rows[j].reaction_name;
			}
			rows[j].reaction_id = null;
		}
		return {rows: rows, max_reaction_name: max_reaction_name, max_reaction_count: max};
	}
	
	function sortByKey(array, key) {
	    return array.sort(function(a, b) {
	        var x = a[key]; var y = b[key];
	        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
	    });
	}

	function reverseSortByKey(array, key) {
	    return array.sort(function(a, b) {
	        var x = a[key]; var y = b[key];
	        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
	    });
	}

	function checkPhotoForNull(photo_name) {
		if(photo_name == null) {
			return constants.default_image_name;
		}
		return photo_name;
	}

	/*
	*	merge topics from (url + previous user interest based on user_id) to make an array with occurence count
	*/
	function mergeTopics(user_id, url) {
		return new Promise(function(resolve, reject) {
			request({
				url: url,
				method: 'GET'
			}, function(err, res, body) {
				arr = getMetaTagTopicsImageTitle(body);
				var json = {};
				models.findAll('user_topics_interests', {'user_id': user_id}, ['topic_id']).then(function(interest_topics_array) {
					json.success = true;
					return topics.getTopicsIdArray(arr.topicsArray, {'interest_topics_array': interest_topics_array.res_array});
				}).then(function(res_array) {
					json.mergedTopicsArray = getMergedArray(res_array.topic_array.concat(res_array.extra_properties.interest_topics_array));
					resolve(json);
				}, function(err) {
					json.success = false;
					reject(json);
				});
			});			
		})
	}

	/*	UTILITY FUNCTION
	*	take an array of topic_id's and return an array of objects having [{id: 1, count: 2}, {id: 3, count: 1}] in the reverse sort fashion
	*/
	function getMergedArray(topics) {
		var countArray = [];
		var topicsArray = [];
		var k = 0;
		for (var i = topics.length - 1; i >= 0; i--) {
			var index = topicsArray.indexOf(topics[i].topic_id);
			if(index != -1) {
				countArray[index]++;
			}
			else {
				countArray[k] = 1;
				topicsArray[k] = topics[i].topic_id;
				k++;
			}
		}
		var finalArray = [];
		for (var i = countArray.length - 1; i >= 0; i--) {
			finalArray[i] = {'id': topicsArray[i], 'count': countArray[i]};
		}
		reverseSortByKey(finalArray, 'count');
		return finalArray;
	}

	function getMergedArticlesArray(articles_array) {
		var countArray = [];
		var articleUrlArray = [];
		var articleImageArray = [];
		var articleTitleArray = [];
		var k = 0;
		for (var i = articles_array.length - 1; i >= 0; i--) {
			var index = articleUrlArray.indexOf(articles_array[i].article_url);
			if(index != -1) {
				countArray[index]++;
			}
			else {
				countArray[k] = 1;
				articleUrlArray[k] = articles_array[i].article_url;
				articleImageArray[k] = articles_array[i].article_image;
				articleTitleArray[k] = articles_array[i].article_title;
				k++;
			}
		}
		var finalArray = [];
		for (var i = countArray.length - 1; i >= 0; i--) {
			finalArray[i] = {'url': articleUrlArray[i], 'image': articleImageArray[i], 'title': articleTitleArray[i], 'count': countArray[i]};
		}
		reverseSortByKey(finalArray, 'count');
		return finalArray;		
	}

	function getArticlesFromTopicsArray(topNTopicsArray, publisher_id) {
		return new Promise(function(resolve, reject) {
			articles.getArticlesFromTopics(topNTopicsArray, publisher_id).then(function(res) {
				resolve(getMergedArticlesArray(res));
			}, function(err) {
				reject(err);
			})
		});
	}

	/*
		url to find the publisher_id, so that i can find articles of that publisher
	*/
	function getRandomArticles(url) {
		return new Promise(function(resolve, reject) {
			models.findOne("publisher_articles", {'article_url': url}, ['publisher_id']).then(function(res) {
				var publisher_id = res.publisher_id;
				return articles.getAllArticlesRelatedToPublishers(publisher_id);
			}).then(function(articles_details_array) {
				
			})
		});
	}

	function searchForArticles(topicsArray, publisher_id) {
		return new Promise(function(resolve, reject) {
			var array = {};
			articles.getArticlesNotBasedOnTopics(topicsArray, publisher_id).then(function(res) {
				array['dislikes'] = res;
				console.log("yes");
				articles.getArticlesBasedOnTopics(topicsArray, publisher_id).then(function(res1) {
					array['likes'] = res1;
					console.log("yes1");
					resolve(array);
				}, function(err1) {
					array['likes'] = {};
					resolve(array);
				})
			}, function(err) {
				resolve({'likes': {}, 'dislikes': {}});
			})
		})
	}

module.exports = {
	getUniqueId: getUniqueId,
	sendResponse: sendResponse,
	getMetaTagTopicsImageTitle: getMetaTagTopicsImageTitle,
	insertIntoPublisherAndArticlesAndTopics: insertIntoPublisherAndArticlesAndTopics,
	getReactionsOnArticle: getReactionsOnArticle,
	getFinalReactionsIncludingZero: getFinalReactionsIncludingZero,
	sortByKey: sortByKey,
	checkPhotoForNull: checkPhotoForNull,
	mergeTopics: mergeTopics,
	getArticlesFromTopicsArray: getArticlesFromTopicsArray,
	searchForArticles: searchForArticles
}