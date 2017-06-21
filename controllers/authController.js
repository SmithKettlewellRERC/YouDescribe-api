const conf = require('../shared/config')();
const apiMessages = require('./../shared/apiMessages');
const nowUtc = require('./../shared/dateTime').nowUtc;
const GoogleAuth = require('google-auth-library');
const User = require('../models/user');
const crypto = require('crypto');

const authController = {
  googleAuth: (req, res, next) => {
    const googleToken = req.body.googleToken;
    const auth = new GoogleAuth;
    const client = new auth.OAuth2(conf.googleClientId, '', '');
    client.verifyIdToken(
      googleToken,
      [conf.googleClientId, conf.googleiOSClientId],

      function(e, login) {
        const payload = login.getPayload();
        const googleUserId = payload['sub'];

        const newToken = crypto.createHmac('sha256', conf.cryptoSecret)
                   .update(conf.cryptoSeed + nowUtc())
                   .digest('hex');

        User.findOneAndUpdate(
          { google_user_id: googleUserId },
          { $set:
            {
              last_login: nowUtc(),
              updated_at: nowUtc(),
              token: newToken,
            }
          }, { new: true }, (err, user) => {
            if (err) {
              const ret = apiMessages.getResponseByCode(1);
              res.status(ret.status).json(ret);
            }
            if (user) {
              const ret = apiMessages.getResponseByCode(1012);
              ret.result = user;
              res.status(ret.status).json(ret);
            } else {
              const newUser = new User({
                email: payload.email,
                name: payload.name,
                given_name: payload.given_name,
                picture: payload.picture,
                locale: payload.locale,
                google_user_id: googleUserId,
                last_login: nowUtc(),
                token: newToken,
              });
              newUser.save((errNewUser, newUser) => {
                if (errNewUser) {
                  const ret = apiMessages.getResponseByCode(1);
                  res.status(ret.status).json(ret);
                }
                if (newUser) {
                  const ret = apiMessages.getResponseByCode(1011);
                  ret.result = newUser;
                  res.status(ret.status).json(ret);
                } else {
                  const ret = apiMessages.getResponseByCode(1);
                  res.status(ret.status).json(ret);                  
                }
              });
            }
          }
        );
      }
    );
  }
};

// payload { azp: '1056671841574-e1r4soednlur8hl2sl0ooumpvftt1s2k.apps.googleusercontent.com',
//   aud: '1056671841574-e1r4soednlur8hl2sl0ooumpvftt1s2k.apps.googleusercontent.com',
//   sub: '110774237357898710088',
//   email: 'lemerodrigo@gmail.com',
//   email_verified: true,
//   at_hash: 'THJlTk0OZQVTR6nXF3lztQ',
//   iss: 'accounts.google.com',
//   iat: 1490227675,
//   exp: 1490231275,
//   name: 'Rodrigo Leme de Mello',
//   picture: 'https://lh4.googleusercontent.com/-OvhBoxw8gj4/AAAAAAAAAAI/AAAAAAAAAOk/pJkPt3SxhPQ/s96-c/photo.jpg',
//   given_name: 'Rodrigo',
//   family_name: 'Leme de Mello',
//   locale: 'en' }
// userid 110774237357898710088

module.exports = authController;
