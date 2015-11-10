'use strict';

var config = require('./config'),
    jwt = require('jsonwebtoken');

function Auth() {
}

Auth.prototype.authenticate = function(data, cb) {
  data.user_id = null;

  if (!data.api_key) return cb({
    status: 400,
    message: 'Bad Request: api_key is required'
   }, null);

  var decodedData = jwt.verify(data.api_key, config.jwt.secret, {
    issuer: config.jwt.issuer,
    expiresInSeconds: config.jwt.expires_in_seconds
  }, function(err, decoded) {
    if (err) {
      cb(err);
    } else {
      data.api_key = null;
      data.user_id = decoded.uid;
      cb(null, data);
    }
  });
};

module.exports = new Auth();
