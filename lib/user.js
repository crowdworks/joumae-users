var config = require('./config'),
    Utilities = require('./util');

var model = require('./model');
var ModelDynamoDB = new model.DynamoDB();

var moment = require('moment');
var bcryptjs = require('bcryptjs');
var _ = require('lodash');
var jwt = require('jsonwebtoken');


// DynamoDB Table Name for this Model
var dynamodb_table = 'joumae-' + config.jaws.data_model_stage + '-users';


// Export
module.exports = new User();

function User() {}



/**
 * SignUp
 */

User.prototype.signUp = function(data, callback) {

    // Defaults
    var _this = this;


    /**
     * Validate
     */

    if (!data.email) return callback({
        status: 400,
        message: 'Bad Request: Email is required'
    }, null);

    if (!data.password) return callback({
        status: 400,
        message: 'Bad Request: Password is required'
    }, null);

    if (data.password && data.password.length < 8) return callback({
        status: 400,
        message: 'Bad Request: Password must be at least 8 characters long'
    }, null);


    // Check if email is already in use
    _this.showByEmail(data.email, function(error, user) {


	    //        if (error) return callback(error, null);

        if (user) return callback({
            status: 409,
            message: 'Email is already in use'
        }, null);



        /**
         * Instantiate
         */

        var user = {
            _id: Utilities.generateID('user'),
            email: data.email ? data.email : null,
            password: data.password ? data.password : null,
            created: moment().unix(),
            updated: moment().unix(),
            plan: 'free',
            sign_in_count: 0
        };


        // Hash Password
        user = _this.hashPassword(user);



        /**
         * Save
         */

        _this.save(user, function(error, user) {


            if (error) return callback(error, null);


            /**
             * Create JSON Web Token & Return 
             */

            var token = jwt.sign({
                uid: user._id
            }, config.jwt.secret, {
                issuer: config.jwt.issuer,
                expiresInSeconds: config.jwt.expires_in_seconds
            });

            return callback(null, {
                jwt: token
            });
        });
    });
}





/**
 * SignIn
 */

User.prototype.signIn = function(data, callback) {

    // Defaults
    var _this = this;


    /**
     * Validate
     */

    if (!data.email) return callback({
        status: 400,
        message: 'Bad Request: Email is required'
    }, null);

    if (!data.password) return callback({
        status: 400,
        message: 'Bad Request: Password is required'
    }, null);



    // Check if email is already in use
    _this.showByEmail(data.email, function(error, user) {

        if (error) return callback(error, null);

        if (!user) return callback({
            status: 404,
            message: 'User not found'
        }, null);


        // Check Password
        if (!bcryptjs.compareSync(data.password, user.password)) return callback({
            status: 401,
            message: 'Invalid login credentials'
        }, null);



        // Update User
        user.sign_in_count++;



        /**
         * Save
         */

        _this.save(user, function(error, user) {

            if (error) return (error, null);



            /**
             * Create JSON Web Token & Return 
             */

            var token = jwt.sign({
                uid: user._id
            }, config.jwt.secret, {
                issuer: config.jwt.issuer,
                expiresInSeconds: config.jwt.expires_in_seconds
            });


            return callback(null, {
                jwt: token
            });
        });
    });
}





/**
 * ShowByEmail
 */

User.prototype.showByEmail = function(email, callback) {


    /**
     * Validate
     */

    if (!email) return callback({
        status: 400,
        message: 'Bad Request: Email is required'
    }, null);



    /**
     * Find User
     */

    var params = {};
    params.TableName = dynamodb_table;
    params.IndexName = "email-index";
    params.KeyConditions = [
        ModelDynamoDB.Condition("email", "EQ", email)
    ];

    ModelDynamoDB.query(params, function(error, response) {

        if (error || !response) return callback({
            status: 500,
            message: 'Sorry, something went wrong.',
            raw: error
        }, null);

        return callback(null, response.Items && response.Items[0] ? response.Items[0] : null);

    });
}







/**
 * ShowByID
 */

User.prototype.showByID = function(user_id, callback) {


    /**
     * Validate
     */

    if (!user_id) return callback({
        status: 400,
        message: 'Bad Request: User ID is required'
    }, null);



    /**
     * Find User
     */

    var params = {};
    params.TableName = dynamodb_table;
    params.KeyConditions = [
			    ModelDynamoDB.Condition("_id", "EQ", user_id.toString())
    ];

    ModelDynamoDB.query(params, function(error, response) {

        console.log("User.showByID", user_id, response);

        if (error || !response) return callback({
            status: 500,
            message: 'Sorry, something went wrong.',
            raw: error
        }, null);

        return callback(null, response.Items && response.Items[0] ? response.Items[0] : null);

    });
}




/**
 * Save
 * - Updates existing record or creates a record if one does not already exist
 */

User.prototype.save = function(user, callback) {


    /**
     * Validate
     */

    if (!user.email) return callback({
        status: 400,
        message: 'Bad Request: Email is required'
    }, null);

    if (!user.password) return callback({
        status: 400,
        message: 'Bad Request: Password is required'
    }, null);

    console.log(user);


    /**
     * Perform Save
     */

    var params = {
        TableName: dynamodb_table,
        ReturnValues: 'ALL_NEW',
        Key: {
            '_id': user._id
        },
        UpdateExpression: 'SET ',
        ExpressionAttributeNames: {},
        ExpressionAttributeValues: {}
    };


    /**
     * Basic Information
     */

    // email
    params.UpdateExpression = params.UpdateExpression + '#a0 = :email_val, ';
    params.ExpressionAttributeNames['#a0'] = 'email';
    params.ExpressionAttributeValues[':email_val'] = user.email;

    // password
    params.UpdateExpression = params.UpdateExpression + '#a1 = :password_val, ';
    params.ExpressionAttributeNames['#a1'] = 'password';
    params.ExpressionAttributeValues[':password_val'] = user.password;

    // salt
    params.UpdateExpression = params.UpdateExpression + '#a2 = :salt_val, ';
    params.ExpressionAttributeNames['#a2'] = 'salt';
    params.ExpressionAttributeValues[':salt_val'] = user.salt;

    // plan
    params.UpdateExpression = params.UpdateExpression + '#a3 = :plan_val, ';
    params.ExpressionAttributeNames['#a3'] = 'plan';
    params.ExpressionAttributeValues[':plan_val'] = user.plan;

    // sign_in_count
    params.UpdateExpression = params.UpdateExpression + '#a4 = :sign_in_count_val, ';
    params.ExpressionAttributeNames['#a4'] = 'sign_in_count';
    params.ExpressionAttributeValues[':sign_in_count_val'] = user.sign_in_count;

    // created
    if (isNaN(user.created)) user.created = moment(user.created).unix();
    params.UpdateExpression = params.UpdateExpression + '#b0 = :created_val, ';
    params.ExpressionAttributeNames['#b0'] = 'created';
    params.ExpressionAttributeValues[':created_val'] = user.created;

    // updated
    params.UpdateExpression = params.UpdateExpression + '#b1 = :updated_val, ';
    params.ExpressionAttributeNames['#b1'] = 'updated';
    params.ExpressionAttributeValues[':updated_val'] = moment().unix();


    /**
     * Save
     */

    // Remove Any Trailing Commas & Space In Update Expression
    params.UpdateExpression = params.UpdateExpression.trim();
    if (params.UpdateExpression[params.UpdateExpression.length - 1] === ',') params.UpdateExpression = params.UpdateExpression.substring(0, params.UpdateExpression.length - 1);


    ModelDynamoDB.updateItem(params, function(error, response) {
       if (error || !response) return callback({
           status: 500,
	   raw: error
	}, null);

        return callback(null, response.Attributes);
    });
}

User.prototype.destroy = function(data, callback) {
  if (!data.user_id) return callback({
      status: 400,
      message: 'Bad Request: user_id is required'
  }, null);


  var params = {
    TableName: dynamodb_table,
    ReturnValues: 'ALL_NEW',
    Key: {
      '_id': data.id
    }
  };

  ModelDynamoDB.deleteItem(params, function(error, response) {
    if (error || !response) return callback({
      status: 500,
      raw: error
    }, null);

    return callback(null, response);
  });
};


/**
 * Hash Password
 */

User.prototype.hashPassword = function(user) {

    user.salt = bcryptjs.genSaltSync(10);
    user.password = bcryptjs.hashSync(user.password, user.salt);

    return user;

};