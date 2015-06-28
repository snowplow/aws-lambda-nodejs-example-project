'use strict';

var aws = require('aws-sdk');
var async = require('async');

module.exports = function (grunt) {

    var DESC = 'creates DynamoDB table called my-table';
    var params = {
            "AttributeDefinitions": [
                {
                    "AttributeName": "Timestamp",
                    "AttributeType": "S"
                },
                {
                    "AttributeName": "EventType",
                    "AttributeType": "S"
                },
                {
                    "AttributeName": "CreatedAt",
                    "AttributeType": "S"
                }
            ],
            "TableName": "my-table",
            "KeySchema": [
                {
                    "AttributeName": "Timestamp",
                    "KeyType": "HASH"
                },
                {
                    "AttributeName": "EventType",
                    "KeyType": "RANGE"
                }
            ],
            "LocalSecondaryIndexes": [
                {
                    "IndexName": "LastPostIndex",
                    "KeySchema": [
                        {
                            "AttributeName": "Timestamp",
                            "KeyType": "HASH"
                        },
                        {
                            "AttributeName": "CreatedAt",
                            "KeyType": "RANGE"
                        }
                    ],
                    "Projection": {
                        "ProjectionType": "KEYS_ONLY"
                    }
                }
            ],
            "ProvisionedThroughput": {
                "ReadCapacityUnits": 20,
                "WriteCapacityUnits": 20
            }
        };
    var DEFAULTS = {
        endpoint: "dynamodb.us-east-1.amazonaws.com",
        region: "us-east-1",
        params: params
    };

    grunt.registerMultiTask('dynamo', DESC, function () {

        var done = this.async();
        var opts = this.options(DEFAULTS);
        
        var credentials = new aws.SharedIniFileCredentials({profile: 'default'});
        aws.config.credentials = credentials;
        var dynamodb = new aws.DynamoDB();
        dynamodb.config.region = DEFAULTS.region;
        dynamodb.config.endpoint = DEFAULTS.endpoint;
        dynamodb.region = DEFAULTS.region;
        dynamodb.endpoint = DEFAULTS.endpoint;
        
        var subtasks = [];
        subtasks.push(createDynamoTable);
        async.series(subtasks, done);

        function createDynamoTable(callback) {

            var params = {
                "AttributeDefinitions": [
                    {
                        "AttributeName": "Timestamp",
                        "AttributeType": "S"
                    },
                    {
                        "AttributeName": "EventType",
                        "AttributeType": "S"
                    },
                    {
                        "AttributeName": "CreatedAt",
                        "AttributeType": "S"
                    }
                ],
                "TableName": "my-table",
                "KeySchema": [
                    {
                        "AttributeName": "Timestamp",
                        "KeyType": "HASH"
                    },
                    {
                        "AttributeName": "EventType",
                        "KeyType": "RANGE"
                    }
                ],
                "LocalSecondaryIndexes": [
                    {
                        "IndexName": "LastPostIndex",
                        "KeySchema": [
                            {
                                "AttributeName": "Timestamp",
                                "KeyType": "HASH"
                            },
                            {
                                "AttributeName": "CreatedAt",
                                "KeyType": "RANGE"
                            }
                        ],
                        "Projection": {
                            "ProjectionType": "KEYS_ONLY"
                        }
                    }
                ],
                "ProvisionedThroughput": {
                    "ReadCapacityUnits": 20,
                    "WriteCapacityUnits": 20
                }
            };
            dynamodb.createTable(params, function (err, data) {
                if (err) console.log(err, err.stack);
                else console.log(data);
                callback(err);
            });
        }

        function taskComplete(err) {
            if(err) {
                grunt.fail.warn(err);
                return done(false);
            }
        }
    });
}








