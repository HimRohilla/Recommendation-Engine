var express = require('express');
var app = express();
var router = express.Router();
var request = require('request');
// var htmlparser = require("htmlparser2");
var constants = require(__path_to_app_utility_constants);
var User = require(constants.path_to_app_models + 'users');
var passport = require('passport');

	router.get('/profile', function(req, res) {
		console.log(req.user);
		res.end();
	});

	// remove this function after testing
	router.get('/createDemoLogin', function(req, res) {
		// req.session.user = {full_name: 'Himanshu Rohilla', photo: 'user1.jpg'};
		res.writeHead(200, {'Content-Type': 'text/html'});	
		res.end();
	});

	router.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	router.post('/login', passport.authenticate('local-login', {
			successRedirect : '/users/profile', // redirect to the secure profile section
			failureRedirect : '/users/login', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		})
	);

	router.post('/signup', passport.authenticate('local-signup', {
		    successRedirect : '/users/profile', // redirect to the secure profile section
		    failureRedirect : '/users/signup', // redirect back to the signup page if there is an error
		    failureFlash : true // allow flash messages
		})
	);

	router.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email'}));

	router.get('/auth/facebook/callback',
		passport.authenticate('facebook', {
			successRedirect : 'back',
			failureRedirect : 'back'
		})
	);

	router.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));

	router.get('/auth/twitter/callback',
	    passport.authenticate('twitter', {
	        successRedirect : 'back',
	        failureRedirect : 'back'
	    })
	);

// google ---------------------------------

    // send to google to do the authentication
	router.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] , display: 'popup'}));

	// the callback after google has authenticated the user
	router.get('/auth/google/callback',
	    passport.authenticate('google', {
	        successRedirect : 'back',
	        failureRedirect : 'back'
	    })
	);

// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

	// locally --------------------------------
	// router.get('/connect/local', function(req, res) {
	//     res.render('YOUR-HTML-FILE-NAME', { message: req.flash('loginMessage') });
	// });

	router.post('/connect/local', passport.authenticate('local-signup', {
			successRedirect : '/users/profile', // redirect to the secure profile section
			failureRedirect : '/users/connect/local', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		})
	);

// facebook -------------------------------

	// send to facebook to do the authentication
		// router.get('/connect/facebook', passport.authorize('facebook', { scope : 'email' }));

	// handle the callback after facebook has authorized the user
	router.get('/connect/facebook/callback', passport.authorize('facebook', {
	        successRedirect : '/users/profile',
	        failureRedirect : '/'
	    })
	);

// twitter --------------------------------

	// send to twitter to do the authentication
		// app.get('/connect/twitter', passport.authorize('twitter', { scope : 'email' }));

	// handle the callback after twitter has authorized the user
	router.get('/connect/twitter/callback', passport.authorize('twitter', {
	        successRedirect : '/users/profile',
	        failureRedirect : '/'
	    })
	);

// google ---------------------------------

    // send to google to do the authentication
    // app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));

    // the callback after google has authorized the user
    router.get('/connect/google/callback', passport.authorize('google', {
            successRedirect : '/users/profile',
            failureRedirect : '/'
        })
	);

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

	// local -----------------------------------
	router.get('/unlink/local', isLoggedIn, function(req, res) {
	    var user = req.user;
	    var newUser = {};
	    newUser.local_email = '';
	    newUser.local_password = '';
	    User.update(newUser, user).then(function(res) {
	    	res.redirect('/users/profile');
	    }, function(err) {
	    	// account was not unlinked
	    	// notify according error
	    });
	});

	// facebook -------------------------------
	router.get('/unlink/facebook', isLoggedIn, function(req, res) {
	    var user = req.user;
	    var newUser = {};
	    User.findOne(user).then(function(res) {
	    	var facebook_info = JSON.parse(res.facebook_info);
	    	delete facebook_info['token'];
	    	facebook_info = JSON.stringify(facebook_info);
	    	User.update({'facebook_info': facebook_info}, user).then(function(res) {
	    		res.redirect('/users/profile');
	    	}, function(err) {
	    		// account not unlinked	    		
	    	});
	    }, function(err) {
	    	// error in finding
	    	// account not unlinked
	    });
	});

	// twitter --------------------------------
	router.get('/unlink/twitter', isLoggedIn, function(req, res) {
	    var user = req.user;
	    var newUser = {};
	    User.findOne(user).then(function(res) {
	    	var twitter_info = JSON.parse(res.twitter_info);
	    	delete twitter_info['token'];
	    	twitter_info = JSON.stringify(twitter_info);
	    	User.update({'twitter_info': twitter_info}, user).then(function(res) {
	    		res.redirect('/users/profile');
	    	}, function(err) {
	    		// account not unlinked	    		
	    	});
	    }, function(err) {
	    	// error in finding
	    	// account not unlinked
	    });	    
	});

	// google ---------------------------------
	router.get('/unlink/google', isLoggedIn, function(req, res) {
		var user = req.user;
		var newUser = {};
		User.findOne(user).then(function(res) {
			var google_info = JSON.parse(res.google_info);
			delete google_info['token'];
			google_info = JSON.stringify(google_info);
			User.update({'google_info': google_info}, user).then(function(res) {
				res.redirect('/users/profile');
			}, function(err) {
				// account not unlinked	    		
			});
		}, function(err) {
			// error in finding
			// account not unlinked
		});	   
	});

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}

module.exports = router;