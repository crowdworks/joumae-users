'use strict';

var Promise = require('bluebird'),
    User = require('./user'),
    Authenticator = require('./auth');

Promise.promisifyAll(User);
Promise.promisifyAll(Authenticator);

var users = {};

users.signUp = unauthenticated(User.signUpAsync.bind(User));
users.signIn = unauthenticated(User.signInAsync.bind(User));

users.show = authenticated(function(params) {
  return User.showByIDAsync.bind(User)(params.user_id);
});

users.destroy = authenticated(User.destroyAsync.bind(User));

function authenticated(action) {
  return function(event, context, cb) {
    console.log("app.js:function authenticated", "event", event);
    if (event.name) {
      event.body.name = event.name;
    }
    return withErrorHandling(Authenticator.authenticateAsync(event.body).then(action)).asCallback(cb);
  };
};

function unauthenticated(action) {
  return function(event, context, cb) {
    console.log("app.js:function unauthenticated", "event", event);
    return withErrorHandling(action(event.body)).asCallback(cb);
  };
};

var withErrorHandling = function(promise) {
  return promise.catch(function(e) {
    console.log("logged error", e, e.stack);
    throw new Error(JSON.stringify(e));
  });
};

module.exports = users;
