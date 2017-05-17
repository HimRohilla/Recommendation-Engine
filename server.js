global.__base = __dirname + '/';
global.__path_to_app_utility_constants = __base + 'app/utility/constants';
var app = require('./app');

app.listen(3000, function(){
	console.log('listening on *:3000');
});