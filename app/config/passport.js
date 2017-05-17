// load all the things we need
var LocalStrategy    = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy  = require('passport-twitter').Strategy;
var GoogleStrategy   = require('passport-google-oauth').OAuth2Strategy;

// load up the user model
var constants = require(__path_to_app_utility_constants);
var User       = require(constants.path_to_app_models + 'users');

// load the auth variables
var configAuth = require('./auth'); // use this one for testing

module.exports = function(passport) {

	// =========================================================================
	// passport session setup ==================================================
	// =========================================================================
	// required for persistent login sessions
	// passport needs ability to serialize and unserialize users out of session

	// used to serialize the user for the session
	passport.serializeUser(function(user, done) {
		done(null, user);
	});

	// used to deserialize the user
	passport.deserializeUser(function(user, done) {
		var cond;
		if(user.user_id) {
			cond = {'user_id': user.user_id};
		}
		else if(user.facebook_id) {
			cond = {'facebook_id': user.facebook_id};
		}
		else if(user.twitter_id) {
			cond = {'twitter_id': user.twitter_id};
		}
		else if(user.google_id) {
			cond = {'google_id': user.google_id};
		}
		User.findOne(cond, ['fullname', 'photo', 'local_email', 'user_id']).then(function(user1) {
			done(null, user1);
		}, function(err) {
			done(err);
		});
	});
	
	// =========================================================================
	// LOCAL LOGIN =============================================================
	// =========================================================================
	passport.use('local-login', new LocalStrategy({
		// by default, local strategy uses username and password, we will override with email
		usernameField : 'email',	// name of text field 'email' comes in request parameters
		passwordField : 'password',	// name of text field 'password' comes in request parameters
		passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
	},
	function(req, email, password, done) {
		if (email)
			email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

		User.findOne({ 'local_email' :  email }, ['fullname', 'photo', 'local_email', 'local_password', 'user_id']).then(function(user) {
			// if no user is found, return the message
			if (!user)
				return done(null, false, req.flash('loginMessage', 'No user found.'));

			if (!User.validPassword(password, user.local_password))
				return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
			else{
				delete user['local_password'];
				return done(null, user);
			}
		}, function(err) {
			if (err)
				return done(err);			
		});
	}));

	// =========================================================================
	// LOCAL SIGNUP ============================================================
	// =========================================================================
	passport.use('local-signup', new LocalStrategy({
		// by default, local strategy uses username and password, we will override with email
		usernameField : 'email',
		passwordField : 'password',
		passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
	},
	function(req, email, password, done) {
		if (email)
			email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

		// if the user is not already logged in:
		if (!req.user) {
			User.findOne({ 'local_email' :  email }).then(function(user){
				if (user) {
					return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
				} else {
					var newUser = {};
					newUser.local_email = email;
					newUser.local_password = User.generateHash(password);

					User.save(newUser).then(function(details) {
						return done(null, newUser);
					}, function(err) {
						if (err)
							return done(err);
					});
				}
			}, function(err) {
				if (err)
					return done(err);
			});
		// if the user is logged in but has no local account...
		} else if ( !req.user.local_password ) {
			// ...presumably they're trying to connect a local account
			// BUT let's check if the email used to connect a local account is being used by another user
			User.findOne({ 'local_email' :  email }).then(function(user) {				
				if (user) {
					return done(null, false, req.flash('loginMessage', 'That email is already taken.'));
					// Using 'loginMessage instead of signupMessage because it's used by /connect/local'
				} else {
					var user = {};
					user.local_email = email;
					user.local_password = User.generateHash(password);
					User.update(user, req.user).then(function(res) {
						var newUser = req.user;
						newUser.local_email = user.email;
						newUser.local_password = user.local_password;
						return done(null, newUser);
					}, function(err) {
						if (err)
							return done(err);
					});
				}
			}, function(err) {
				if (err)
					return done(err);
			});
		} else {
			// user is logged in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)
			return done(null, req.user);
		}
	}));

	// =========================================================================
	// FACEBOOK ================================================================
	// =========================================================================
	var fbStrategy = configAuth.facebookAuth;
	fbStrategy.passReqToCallback = true;  // allows us to pass in the req from our route (lets us check if a user is logged in or not)
	passport.use(new FacebookStrategy(fbStrategy,
	function(req, token, refreshToken, profile, done) {
		// check if the user is already logged in
		if (!req.user) {
			User.findOne({'facebook_id' : profile.id}, ['local_email', 'user_id', 'fullname', 'photo', 'facebook_info']).then(function(user) {
				if (user) {
					// if there is a user id already but no token (user was linked at one point and then removed)
					// json_decode facebook_info json
					user.facebook_info = JSON.parse(user.facebook_info);
					if (!user.facebook_info.token) {
						var facebook_info = {};
						facebook_info.token = token;
						facebook_info.name  = profile.name.givenName + ' ' + profile.name.familyName;
						facebook_info.email = (profile.emails[0].value || '').toLowerCase();
						var newUser = {};
						newUser.facebook_info = JSON.stringify(facebook_info);
						User.update(newUser, user).then(function(res) {	
							user.facebook_info = facebook_info;							
							return done(null, user);
						}, function(err) {
							if (err)
								return done(err);
						});
					}
					return done(null, user); // user found, return that user
				} else {
					// if there is no user, create them
					var newUser            = {};
					newUser.facebook_id    = profile.id;
					var facebook_info = {};
					facebook_info.token = token;
					facebook_info.name  = profile.name.givenName + ' ' + profile.name.familyName;
					facebook_info.email = (profile.emails[0].value || '').toLowerCase();
					newUser.facebook_info = JSON.stringify(facebook_info);
					newUser.local_email = facebook_info.email;
					newUser.fullname = facebook_info.name;
					User.save(newUser).then(function(res) {
						newUser.facebook_info = facebook_info;
						return done(null, newUser);
					}, function(err) {
						if (err)
							return done(err);
					});
				}				
			}, function(err) {
				if (err)
					return done(err);
			});

		} else {
			// user already exists and is logged in, we have to link accounts
			var user = req.user; // pull the user out of the session
			var newUser = {};
			newUser.facebook_id    = profile.id;
			var facebook_info = {}
			facebook_info.token = token;
			facebook_info.name  = profile.name.givenName + ' ' + profile.name.familyName;
			facebook_info.email = (profile.emails[0].value || '').toLowerCase();
			newUser.facebook_info = JSON.stringify(facebook_info);
			User.update(newUser, user).then(function(res) {
				user.facebook_info = facebook_info;
				return done(null, user);
			}, function(err) {
				if (err)
					return done(err);
			});
		}
	}));

	// =========================================================================
	// TWITTER =================================================================
	// =========================================================================
	passport.use(new TwitterStrategy({

		consumerKey     : configAuth.twitterAuth.consumerKey,
		consumerSecret  : configAuth.twitterAuth.consumerSecret,
		callbackURL     : configAuth.twitterAuth.callbackURL,
		passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

	},
	function(req, token, tokenSecret, profile, done) {
		// check if the user is already logged in
		if (!req.user) {
			User.findOne({ 'twitter_id' : profile.id }, ['local_email', 'user_id', 'fullname', 'photo', 'twitter_info']).then(function(user) {
				if (user) {
					// if there is a user id already but no token (user was linked at one point and then removed)
					user.twitter_info = JSON.parse(user.twitter_info);
					if (!user.twitter_info.token) {
						var twitter_info = {};
						twitter_info.token       = token;
						twitter_info.username    = profile.username;
						twitter_info.displayName = profile.displayName;
						twitter_info = JSON.stringify(twitter_info);
						User.update({'twitter_info': twitter_info}, user).then(function(res) {
							user.twitter_info = twitter_info;
							return done(null, user);
						}, function(err) {
							if (err)
								return done(err);
						});
					}
					return done(null, user); // user found, return that user
				} else {
					// if there is no user, create them
					var newUser = {};
					var twitter_info = {};
					newUser.twitter_id = profile.id;
					twitter_info.token = token;
					twitter_info.username = profile.username;
					twitter_info.displayName = profile.displayName;
					newUser.twitter_info = JSON.stringify(twitter_info);
					newUser.fullname = twitter_info.displayName;				
					User.save(newUser).then(function(res) {
						newUser.twitter_info = twitter_info;			
						return done(null, newUser);
					}, function(err) {
						if (err)
							return done(err);
					});
				}
			}, function(err) {
				if (err)
					return done(err);
			});
		} else {
			// user already exists and is logged in, we have to link accounts
			var user                 = req.user; // pull the user out of the session
			var twitter_info = {};
			var newUser = {}
			newUser.twitter_id          = profile.id;
			twitter_info.token       = token;
			twitter_info.username    = profile.username;
			twitter_info.displayName = profile.displayName;
			newUser.twitter_info = JSON.stringify(twitter_info);
			User.update(newUser, user).then(function(res) {
				user.twitter_info = twitter_info;
				return done(null, user);
			}, function(err) {
				if (err)
					return done(err);
			})
		}
	}));

	// =========================================================================
	// GOOGLE ==================================================================
	// =========================================================================
	passport.use(new GoogleStrategy({

		clientID        : configAuth.googleAuth.clientID,
		clientSecret    : configAuth.googleAuth.clientSecret,
		callbackURL     : configAuth.googleAuth.callbackURL,
		passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

	},
	function(req, token, refreshToken, profile, done) {
		// check if the user is not already logged in
		if (!req.user) {
			User.findOne({ 'google_id' : profile.id }, ['local_email', 'user_id', 'fullname', 'photo', 'google_info']).then(function(user) {
				if (user) {
					// if there is a user id already but no token (user was linked at one point and then removed)
					user.google_info = JSON.parse(user.google_info);
					if (!user.google_info.token) {
						var google_info = {};
						google_info.token = token;
						google_info.name = profile.displayName;
						google_info.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email
						var g_info = JSON.stringify(google_info);
						User.update({'google_info': g_info}, user).then(function(res) {
							user.google_info = google_info;
							return done(null, user);
						}, function(err) {
							if (err)
								return done(err);
						});
					}
					return done(null, user);
				} else {
					var newUser          = {};
					newUser.google_id    = profile.id;
					var google_info = {};
					google_info.token = token;
					google_info.name  = profile.displayName;
					google_info.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email
					newUser.google_info = JSON.stringify(google_info);
					newUser.local_email = google_info.email;
					newUser.fullname = google_info.name;
					User.save(newUser).then(function(res) {	
						newUser.google_info = google_info;
						return done(null, newUser);
					}, function(err) {
						if (err)
							return done(err);
					});
				}
			}, function(err) {
				if (err)
					return done(err);
			});

		} else {
			// user already exists and is logged in, we have to link accounts
			var user = req.user; // pull the user out of the session
			var newUser = {};
			var google_info = {};
			newUser.google_id    = profile.id;
			google_info.token = token;
			google_info.name  = profile.displayName;
			google_info.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email
			newUser.google_info = JSON.stringify(google_info);
			User.update(newUser, user).then(function(res) {
				user.google_info = google_info;
				return done(null, user);
			}, function(err) {
				if (err)
					return done(err);
			});
		}
	}));
};
