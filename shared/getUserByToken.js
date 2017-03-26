const conf = require('../shared/config')();
const GoogleAuth = require('google-auth-library');
const User = require('../models/user');

function getUserByToken(token) {
  return new Promise((resolve, reject) => {
    if (!token) {
      reject(Error({}));      
    }
    const auth = new GoogleAuth;
    const client = new auth.OAuth2(conf.googleClientId, '', '');
    client.verifyIdToken(
      token,
      conf.googleClientId,
      function(e, login) {
        if (e) {
          console.log(e)
          reject({});
        } else {
          const payload = login.getPayload();
          const googleUserId = payload['sub'];
          User.findOne({ google_user_id: googleUserId }, (err, user) => {
            if (err) {
              reject({});
            }
            if (user) {
              resolve(user);
            } else {
              reject({});
            }
          });
        }
      }
    );
  });
}

module.exports = getUserByToken;
