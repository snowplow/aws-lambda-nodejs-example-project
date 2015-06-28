'use strict';

var aws = require('aws-sdk');
var async = require('async');

module.exports = function (grunt) {

    var DESC = 'describe kinesis stream called my-stream';
    var params = {
        StreamName: 'my-stream',
    };
    var DEFAULTS = {
        endpoint: "kinesis.us-east-1.amazonaws.com",
        lambdaEndpoint: "lambda.us-east-1.amazonaws.com",
        region: "us-east-1",
        params: params,
        streamARN: null
    };

    grunt.registerMultiTask('associateStream', DESC, function () {

        var done = this.async();
        var opts = this.options(DEFAULTS);
        
        var credentials = new aws.SharedIniFileCredentials({profile: 'default'});
        aws.config.credentials = credentials;
        aws.config.apiVersions = {
            kinesis: '2013-12-02',
        };

        var kinesis = new aws.Kinesis();
        kinesis.config.region = DEFAULTS.region;
        kinesis.config.endpoint = DEFAULTS.endpoint;
        kinesis.region = DEFAULTS.region;
        kinesis.endpoint = DEFAULTS.endpoint;
        
        var lambda = new aws.Lambda();
        lambda.config.region = DEFAULTS.region;
        lambda.config.endpoint = DEFAULTS.lambdaEndpoint;
        lambda.region = DEFAULTS.region;
        lambda.endpoint = DEFAULTS.lambdaEndpoint;
        

        var subtasks = [];
        subtasks.push(describeStream);
        subtasks.push(associateStream);
        async.series(subtasks, done);

        function describeStream(callback) {
            var params = {
              'StreamName': 'my-stream'
            };
            kinesis.describeStream(params, function(err, data) {
                if (err) console.log(err, err.stack);
                else {
                    console.log(data.StreamDescription.StreamARN);
                    DEFAULTS.streamARN = data.StreamDescription.StreamARN;
                }
                callback(err);
            });
        }


        function associateStream(callback) {
            var params = {
                EventSourceArn: DEFAULTS.streamARN,
                FunctionName: 'ProcessKinesisRecordsDynamo',
                StartingPosition: 'TRIM_HORIZON',
                BatchSize: 100
            };
            lambda.createEventSourceMapping(params, function(err, data) {
                if (err) console.log(err, err.stack);
                else {
                    console.log(data);
                }
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








