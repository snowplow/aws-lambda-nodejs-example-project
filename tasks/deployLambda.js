var fs = require('fs');
var AWS = require('aws-sdk');
var extend = require('util')._extend;
var async = require('async');


module.exports = function (grunt) {

    var DESC = 'Uploads a package to lambda';

    grunt.registerMultiTask('deployLambda', DESC, function () {
      
        var DEFAULTS = {
            endpoint:  'iam.amazonaws.com'
        };
        var credentials = new AWS.SharedIniFileCredentials({profile: 'default'});
        AWS.config.credentials = credentials;
 
        var done = this.async();

        AWS.config.update({region: 'us-east-1'});
        var lambda = new AWS.Lambda({
            apiVersion: '2015-03-31'
        });

        var iam = new AWS.IAM({apiVersion: '2010-05-08'});
        iam.config.endpoint = DEFAULTS.endpoint;
        iam.endpoint = DEFAULTS.endpoint;

        // main
        var subtasks = [];
        subtasks.push(listRoles);
        subtasks.push(createFunction);
        async.series(subtasks, done);

        function listRoles(callback) {
            paramsRole = {}
            iam.listRoles(paramsRole, function(err, data) {
                if (err) { 
                    console.log(err, err.stack); 
                } else { 
                    DEFAULTS['arnRoles'] = data.Roles;
                    for (var i = 0; i < DEFAULTS.arnRoles.length; i++) {
                        var lambdaRole = data.Roles[i].Arn;
                        if (lambdaRole.indexOf("LambdaExecRole") > 38 && lambdaRole.indexOf("LambdaExecRole") < 48) {
                            DEFAULTS['arn'] = data.Roles[i].Arn;
                            console.log("Found");
                            console.log(DEFAULTS.arn);
                        } else {
                            console.log("Looking for ... kinesisDynamo-LambdaExecRole");
                        }
                    }
                }
                callback(err);
            });
        }


        function createFunction(callback) {
            
            var params = {
                FunctionName: 'ProcessKinesisRecordsDynamo',
                Handler: 'ProcessKinesisRecords.handler',
                Role: DEFAULTS.arn,
                Timeout: 3
            };
            console.log("Polling for ARN");
            console.log(DEFAULTS.arn);
            grunt.log.writeln('Trying to create AWS Lambda Function...');

            fs.readFile('dist/aws-lambda-example-project_0-1-0_latest.zip', function(err, data) {
        
                if (err) {
                    return callback('Error reading specified package "'+ 'dist/aws-lambda-example-project_0-1-0_latest.zip' + '"');
                }

                params['Code'] = { ZipFile: data };
                params['Runtime'] = "nodejs";
        
                lambda.createFunction(params, function(err, data) {
                    if (err) {
                        var warning = 'Create function failed. '
                        warning += 'Check your iam:PassRole permissions.'
                        callback(err);
                    } else {
                        grunt.log.writeln('Created AWS Lambda Function...');
                    }
                });
        
            });
        
        };

    });
}


