var express = require('express');
var app = express();
var router = express.Router();
var users = require('../models/users');
app.engine('js', require('ejs').renderFile);
app.set('view engine', 'js');

router.use('/assets/api/article-script.js', function(req, res) {
	res.render('public/assets/api/article-script');
});

router.get('/', function(req, res) {
	users.getTempUser();
});

module.exports = router;