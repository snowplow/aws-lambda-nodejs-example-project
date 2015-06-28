'use strict';

var aws = require('aws-sdk');
var async = require('async');

module.exports = function (grunt) {

    var DESC = 'creates kinesis stream called my-stream';
    var params = {
        'ShardCount': 1, 
        'StreamName': 'my-stream'
    };
    var DEFAULTS = {
        endpoint: "kinesis.us-east-1.amazonaws.com",
        region: "us-east-1",
        params: params
    };

    grunt.registerMultiTask('kinesis', DESC, function () {

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
        
        var subtasks = [];
        subtasks.push(createStream);
        async.series(subtasks, done);

        function createStream(callback) {
            var params = {
              'ShardCount': 1, 
              'StreamName': 'my-stream'
            };
            kinesis.createStream(params, function(err, data) {
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








