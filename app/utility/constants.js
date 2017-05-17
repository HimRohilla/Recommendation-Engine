var constants = require('./constants');

function define(name, value) {
	Object.defineProperty(exports, name, {
		value:      value,
		enumerable: true,
		writable:     false,
		configurable: false
	});
}
define("host", "localhost");
define("username", "root");
define("password", "");
define("db_name", "project_major");
define("URL", "http://localhost:3000/");
define("domain", "localhost:3000");
define("emoticons_base_path", constants.URL + "public/img/emoticons/");
define("emoticons_extension", ".svg");
define("default_image_name", "profile.png");
define("users_images_base_path", constants.URL + "public/img/users_images/");
define("article_images_base_path", constants.URL + "public/img/articles_images/");
define("session_secret", 'ANY_SECRET');
define("path_to_app_controllers", __base + "app/controllers/");
define("path_to_app_models", __base + "app/models/");
define("path_to_app_views", __base + "app/views/");
define("path_to_app_utility", __base + 'app/utility/');
define("path_to_app_config", __base + 'app/config/');
define("max_num_of_recommended_articles", 5);
