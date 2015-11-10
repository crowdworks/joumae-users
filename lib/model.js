'use strict';

var AWS = require('aws-sdk');

module.exports.DynamoDB = function() {
    var DOC = require('dynamodb-doc');
    return new DOC.DynamoDB(new AWS.DynamoDB());
};

module.exports.Lambda = new AWS.Lambda();

module.exports.SES = new AWS.SES();
