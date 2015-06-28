'use strict';

var aws = require('aws-sdk'); 
var async = require('async');


module.exports = function (grunt) {

    var DESC = 'creates AWS lambda admin role using CloudFormation';
    var DEFAULTS = {
        endpoint: "cloudformation.us-east-1.amazonaws.com",
        region: "us-east-1",
        desc:'creates AWS lambda admin role using CloudFormation'
    };

    grunt.registerMultiTask('createRole', DEFAULTS.desc, function () {

        var done = this.async();
        var opts = this.options(DEFAULTS);

        var credentials = new aws.SharedIniFileCredentials({profile: 'default'});
        aws.config.credentials = credentials;
        var cloudformation = new aws.CloudFormation({apiVersion: '2010-05-15'});
        cloudformation.region = DEFAULTS.region;
        cloudformation.endpoint = DEFAULTS.endpoint;
        cloudformation.config.region = DEFAULTS.region;
        cloudformation.config.endpoint = DEFAULTS.endpoint;

        var subtasks = [];
        subtasks.push(createRole);
        async.series(subtasks, done);

        function createRole(callback) {

            var params = {
                StackName: 'kinesisDynamo',
                Capabilities: [
                    'CAPABILITY_IAM',
                ],
                TemplateURL: 'https://snowplow-hosted-assets.s3.amazonaws.com/third-party/aws-lambda/lambda-admin.template'
            };

	        cloudformation.createStack(params, function (err, data) {
	            if (err) console.log(err, err.stack);
	            else console.log(data);
	            callback(err);
	        });
        }
    });
}

