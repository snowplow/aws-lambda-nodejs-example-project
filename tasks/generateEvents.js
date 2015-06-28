'use strict';

var aws = require('aws-sdk');
var async = require('async');

module.exports = function (grunt) {

    var DESC = 'generate simple events for kinesis stream called my-stream';
    var DEFAULTS = {
        endpoint: "kinesis.us-east-1.amazonaws.com",
        region: "us-east-1"
    };
    var STREAMNAME = 'my-stream';
    var COLORS = ['Red','Orange','Yellow','Green','Blue'];

    grunt.registerMultiTask('generateEvents', DESC, function () {

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
        for (var i=1; i < 10000; i += 1){
            subtasks.push(writeToKinesis);
        }
        async.series(subtasks, done);
    
        
        function SimpleEvent() {
            this.timestamp = new Date().toISOString();
            this.type = COLORS[Math.floor(Math.random() * COLORS.length)];
        }
 
        function guid() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
            }
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        }

        function writeToKinesis(callback) {

            var instance = new SimpleEvent();
            var data = JSON.stringify(instance);
            var partitionKey = 'pk-' + guid();
            var recordParams = {
                Data: data,
                PartitionKey: partitionKey,
                StreamName: 'my-stream'
            };
            console.log("Writing Kineis Event: " + data);             
            kinesis.putRecord(recordParams, function(err, data) {
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








