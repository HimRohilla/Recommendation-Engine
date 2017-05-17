CREATE DATABASE project_major;
USE project_major;

		-- Lists Users Data (Required for Login) -- Contains Guest Accounts
		CREATE TABLE users (
			user_id INT(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
			auth_type VARCHAR(50) NOT NULL,
			acc_type INT(2),
			fullname TEXT NOT NULL,
			gender VARCHAR(1),
			dob DATE,
			photo TEXT,
			email VARCHAR(100) NOT NULL UNIQUE,
			password_hash TEXT
		);

-- Links user_id WRT topic_id (their interest)
CREATE TABLE user_topic_interests (
	user_id INT(11) NOT NULL,
	topic_id INT(11) NOT NULL,
	PRIMARY KEY(user_id, topic_id)
);

		-- Lists Publishers Data (Required for Login to Admin Panel)
		CREATE TABLE publishers (
			publisher_id INT(11) NOT NULL PRIMARY KEY,
			acc_type INT(2) NOT NULL DEFAULT 1,
			publisher_name TEXT NOT NULL,
			domain_name VARCHAR(100) NOT NULL,
			site_url TEXT NOT NULL,
			password_hash TEXT NOT NULL
		);

		-- Lists Publishers articles data
		CREATE TABLE publisher_articles (
			article_id INT(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
			publisher_id INT(11) NOT NULL,
			article_title TEXT NOT NULL,
			article_url TEXT NOT NULL
		);

		-- Links topic_id WRT article_id
		CREATE TABLE publisher_article_topics (
			article_id INT(11) NOT NULL,
			topic_id INT(11) NOT NULL,
			PRIMARY KEY(article_id, topic_id)
		);

		-- Lists reaction_id WRT user_id and article_id
		CREATE TABLE publisher_article_reactions (
			article_id INT(11) NOT NULL,
			user_id INT(11) NOT NULL,
			reaction_id INT(2) NOT NULL,
			PRIMARY KEY(article_id, user_id)
		);

		-- Lists comments WRT article_id and user_id
		CREATE TABLE publisher_article_comments (
			comment_id INT(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
			article_id INT(11) NOT NULL,
			user_id INT(11) NOT NULL,
			comment_text LONGTEXT NOT NULL,
			date_commented DATETIME NOT NULL
		);

		-- Defines Topics -- Indefinitely generated
		CREATE TABLE topics (
			topic_id INT(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
			topic_name TEXT NOT NULL
		);

-- Defines Categories -- Definite
CREATE TABLE categories (
	category_id INT(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
	category_name TEXT NOT NULL
);

-- Links Topics and Categories
CREATE TABLE category_topics (
	category_id INT(11) NOT NULL,
	topic_id INT(11) NOT NULL,
	PRIMARY KEY(category_id, topic_id)
);

		-- Lists Available Reactions (Limited to 6) -- Definite
		CREATE TABLE reactions (
			reaction_id INT(2) NOT NULL PRIMARY KEY AUTO_INCREMENT,
			reaction_title VARCHAR(20) NOT NULL UNIQUE
		);
