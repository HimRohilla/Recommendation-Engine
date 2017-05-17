// $('.owl-carousel').owlCarousel({
//     loop:true,
//     margin:10,
//     nav:true,
//     responsive:{
//         0:{
//             items:1
//         },
//         300:{
//             items:2
//         },
//         600:{
//             items:3
//         },
//         1000:{
//             items:4
//         }
//     }
// });

function getSyncScriptParams() {
	var scripts = document.getElementsByTagName('script');
	for (var i = scripts.length - 1; i >= 0; i--) {
		if(scripts[i].getAttribute('data-id') !== undefined && scripts[i].getAttribute('data-id') !== null) {
			return scripts[i].getAttribute('data-id');
		}
	}
}
var app = angular.module('rec-engine-app', ['ngSanitize']);

app.controller('rec-engine-ctrl', function($scope, $http, $compile, $window) {
	var id = getSyncScriptParams();
	$scope.flag = -1;
	// change also facebook url in button on api/index.html
	$scope.serverResponse = {};
	$scope.comment_data = "";
	$scope.submitComment = false;
	$scope.saveAndGet = function() {
		$http({
			method  : 'GET',
			url     : 'http://localhost:3000/articles/saveArticle?url=' + window.location.href + '&id=' + id,
			headers : { 'Content-Type': 'text/html' },
			withCredentials: true
		})
		.success(function(data) {
			$scope.serverResponse = data;
			$scope.flag = 0;
		});
	};
	angular.element(document).ready(function() {
		if (window.location.hash && window.location.hash === "#_=_") {
		  // If you are not using Modernizr, then the alternative is:
		  if (window.history && history.pushState) {
			window.history.pushState("", document.title, window.location.pathname);
		  } else {
			// Prevent scrolling by storing the page's current scroll offset
			var scroll = {
			  top: document.body.scrollTop,
			  left: document.body.scrollLeft
			};
			window.location.hash = "";
			// Restore the scroll offset, should be flicker free
			document.body.scrollTop = scroll.top;
			document.body.scrollLeft = scroll.left;
		  }
		}		
		$scope.saveAndGet();
	});

	// calls loadWidget on page reach to div
	angular.element($window).bind("scroll", function() {
		if(!$scope.serverResponse.error_message) {
			if(this.pageYOffset + this.innerHeight >= angular.element(document.querySelector('#recommendation-engine')).prop('offsetTop')) {
				if($scope.flag == 0) {
					$scope.flag = 1;
					$scope.loadWidget();
				}
				else if($scope.flag == -1) {
					$scope.showLoading();
				}
			}
		}
	});
	
	$scope.showLoading = function() {
		$("#recommendation-engine").html('<ul class="loading"><li></li><li></li><li></li></ul>');    	
	}

	// loads the widget
	$scope.loadWidget = function() {
		$scope.showLoading();
		$http({
			method  : 'GET',
			url     : 'http://localhost:3000/public/assets/api/index.html',
			headers : { 'Content-Type': 'text/html' }
		})
		.success(function(data) {
			$scope.widget = data;
			$scope.loadDataInWidget($scope.serverResponse);	// loads the data in widget
		});
	}

	$scope.loadDataInWidget = function(response) {
		$scope.most_reaction = response.emoticons_base_path + response.reaction_data.max_reaction_name + response.emoticons_extension;
		$scope.most_reaction_name = response.reaction_data.max_reaction_name;
		$scope.max_reaction_count = response.reaction_data.max_reaction_count;
		$scope.reaction_data = response.reaction_data.rows;
		$scope.emoticons_base_path = response.emoticons_base_path;
		$scope.emoticons_extension = response.emoticons_extension;
		$scope.comments_data = response.comments_data;
		$scope.users_images_base_path = response.users_images_base_path;
		$scope.user_logged_in = response.user_logged_in;
		// console.log($scope.user_logged_in);
		if(response.user_details) {
			$scope.user_details = response.user_details;
			$scope.comment_button_name = "post as " + $scope.user_details.fullname;
		}
		$scope.articles_array = response.articles_array;
		$scope.final_articles = $scope.shuffleArray($scope.articles_array['likes']);
	}

	$scope.sendComment = function(comment) {
		$scope.submitComment = true;
		var dt = new Date();
		var dtstring = dt.getFullYear()
			+ '-' + (dt.getMonth()+1)
			+ '-' + (dt.getDate())
			+ ' ' + (dt.getHours())
			+ ':' + (dt.getMinutes())
			+ ':' + (dt.getSeconds());

		$http({
			method  : 'POST',
			url     : 'http://localhost:3000/comments/postComment',
			data    : $.param({'email': $scope.user_details.local_email, 'url': window.location.href, 'comment': comment, 'date': dtstring}),
			headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
		})
		.success(function(data) {
			if(data.success) {
				//	comment saved
				$scope.submitComment = false;
				$scope.comment = "";
				//{"comment_text":"user1 commented","date_commented":"2017-03-21T18:30:00.000Z","fullname":"Himanshu Rohilla","photo":"user1.jpg"}
				var newComment = {};
				newComment.comment_text = comment;
				newComment.date_commented = dtstring;
				newComment.fullname = data.fullname;
				newComment.photo = data.user_photo;
				$scope.comments_data.push(newComment);
			}
			else {
				//	comment not saved
				$scope.error_message = data.error_message;
				$scope.show_error_message = true;
				$scope.submitComment = false;
			}
		});		
	}

	$scope.sendReaction = function(reaction_name) {
		$http({
			method  : 'POST',
			url     : 'http://localhost:3000/reactions/saveReaction',
			data    : $.param({'email': $scope.user_details.local_email, 'url': window.location.href, 'reaction_name': reaction_name}),
			headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
		})
		.success(function(data) {
			if(data.success) {
				// suggest related articles
				var max = $scope.max_reaction_count;
				for (var i = $scope.reaction_data.length - 1; i >= 0; i--) {
					if($scope.reaction_data[i].reaction_name === reaction_name) {
						$scope.reaction_data[i].count++;
						// $("#" + reaction_name).addClass("active");
					}
					if($scope.reaction_data[i].reaction_name === data.old_reaction_name) {
						$scope.reaction_data[i].count--;
						// $("#" + data.old_reaction_name).removeClass("active");
					}
					if(max <= $scope.reaction_data[i].count) {
						$scope.most_reaction = $scope.emoticons_base_path + $scope.reaction_data[i].reaction_name + $scope.emoticons_extension;						
						$scope.most_reaction_name = $scope.reaction_data[i].reaction_name;
					}
				}
			}
			else {
				// reload widget
				$scope.loadWidget();
			}
			if(reaction_name == 'happy' || reaction_name == 'excited' || reaction_name == 'surprised') {
				$scope.final_articles = $scope.shuffleArray($scope.articles_array['likes']);
			}
			else {
				$scope.final_articles = $scope.shuffleArray($scope.articles_array['dislikes']);
			}
		});
	}

	$scope.shuffleArray = function(array) {
		for (var i = array.length - 1; i > 0; i--) {
		    var j = Math.floor(Math.random() * (i + 1));
		    var temp = array[i];
		    array[i] = array[j];
		    array[j] = temp;
		}
		return array.slice(0, 4);
	}
});

app.directive('dynamic', function ($compile) {
  return {
	restrict: 'A',
	replace: true,
	link: function (scope, ele, attrs) {
	  scope.$watch(attrs.dynamic, function(widget) {
		ele.html(widget);
		$compile(ele.contents())(scope);
	  });
	}
  };
});

// use below to load widget in blogs
// $("#recommendation-engine").load("http://localhost:3000/public/assets/api/index.html");

// to show loading ... show loading when user's cursor moved to comments section and then start loading data
// $("#recommendation-engine").html('<ul class="loading"><li></li><li></li><li></li></ul>');