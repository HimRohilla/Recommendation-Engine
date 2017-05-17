	Emoticons
	1.	name of emoticons in table('reactions') must be same as their file name
	2.	to change the order of emoticons in widget, follow the order in reaction table because emojis are sorted on the basis of reaction_id at the end

	Images
	1. store only the image file name(for user images or article images both) in table and the root directory is views/public/img/users_images for registered user and publisher images and views/public/img/articles_images for images of articles of different publishers
	2. if a users image is not there then save the default user image icon name.jpg in table

	User
	1. Cookie is set for every user and when we read data from cookie of user then we will check for user validity through user_token and after check update that token also both in db as well as in cookie