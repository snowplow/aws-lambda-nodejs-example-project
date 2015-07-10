'use strict';

var aws = require('aws-sdk');
var async = require('async');

module.exports = function (grunt) {

    var DESC = 'attaches ADMIN policy to newly created Lambda exec role';
    var params = {
        'PolicyArn': 'arn:aws:iam::aws:policy/AdministratorAccess',
        'RoleName': null
    };
    var DEFAULTS = {
        endpoint:  'iam.amazonaws.com',
        params: params
    };

    grunt.registerMultiTask('attachRole', DESC, function () {

        var done = this.async();
        var opts = this.options(DEFAULTS);
        
        var credentials = new aws.SharedIniFileCredentials({profile: 'default'});
        aws.config.credentials = credentials;
        var iam = new aws.IAM({apiVersion: '2010-05-08'});
        iam.config.endpoint = DEFAULTS.endpoint;
        iam.endpoint = DEFAULTS.endpoint;
        
        var subtasks = [];
        subtasks.push(listRoles);
        subtasks.push(attachRole);
        async.series(subtasks, done);

        function listRoles(callback) {
            params = {}
            iam.listRoles(params, function(err, data) {
                if (err) { 
                    console.log(err, err.stack); 
                } else { 
                    opts.params['arnRoles'] = data.Roles;
                    for (var i = 0; i < opts.params.arnRoles.length; i++) {
                        //opts.params.RoleName = data.Roles[0].RoleName;
                        var lambdaRole = data.Roles[i].RoleName;
                        if (lambdaRole.indexOf("LambdaExecRole") > 0) {
                            opts.params.RoleName = data.Roles[i].RoleName;
                            console.log("Found");
                            console.log(opts.params.RoleName);
                        } else {
                            console.log("Looking for ... kinesisDynamo-LambdaExecRole");
                        }
                    }
                callback(err);
                }
            });
        }


        function attachRole(callback) {
            var params = {
                'PolicyArn': 'arn:aws:iam::aws:policy/AdministratorAccess',
                'RoleName': opts.params.RoleName
            };
            iam.attachRolePolicy(params, function(err, data) {
                if (err) console.log(err, err.stack);
                else console.log(data);
                callback(err);
            });   
        }
    });
}







