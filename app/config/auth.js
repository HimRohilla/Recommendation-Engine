// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'        : '905772966232338', // your App ID
        'clientSecret'    : 'cc66020d4d58f26d80d0727495967ed9', // your App Secret
        'callbackURL'     : 'http://localhost:3000/users/auth/facebook/callback',
        'profileURL': 'https://graph.facebook.com/v2.5/me?fields=first_name,last_name,email'

    },

    'twitterAuth' : {
        'consumerKey'        : 'TfSTtXyjhDuG7I2CJlbaZ0q7u',
        'consumerSecret'     : 'huFyAuSbEM4m49ftNwLiwb3jG62GxfioL5N2OfVx4YUukedfKK',
        'callbackURL'        : 'http://localhost:3000/users/auth/twitter/callback'
    },

    'googleAuth' : {
        'clientID'         : '247283536207-d9mg0m30hnn6rv346282hu1n6de7ghgl.apps.googleusercontent.com',
        'clientSecret'     : 'T-0RuScL3RcAif-zMyAf0dxX',
        'callbackURL'      : 'http://localhost:3000/users/auth/google/callback'
    }

};
