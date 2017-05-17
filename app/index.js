var express = require('express');
var app = express();
var router = express.Router();
var fs = require('fs');
var ejs = require('ejs');
var constants = require(__path_to_app_utility_constants);
var publishers = require(constants.path_to_app_models + 'publishers');
var passport = require('passport');
var flash    = require('connect-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
require(constants.path_to_app_config + 'passport')(passport);
app.use(cookieParser());
app.use(session({ 
	secret: constants.session_secret,
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());
// setting view engine
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// setting middleware for all requests
router.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
	res.header('Access-Control-Allow-Credentials', 'true');
	res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
	res.header('Access-Control-Expose-Headers', 'Content-Length');
	res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');		
	if (req.method === 'OPTIONS') {
		return res.send(200);
	} else {
		return next();
	}
});
app.use('/', router);

//to include all controllers
fs.readdirSync(constants.path_to_app_controllers).forEach(function (file) {
	if(file.substr(-3) == '.js') {
		str = "/" + file.substr(0, file.length - 3) + "/";
		app.use(str, require(constants.path_to_app_controllers + file));
	}
});

router.use('/public/*', function(req, res) {
	file_url = __base + req.originalUrl;
	res.sendFile(file_url);
});

router.get('/', function(req, res) {
	console.log(req.user);
	res.end();
});

module.exports = app;