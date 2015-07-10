'use strict';

var async = require('async');
var path = require('path');
var npm = require('npm');
var tmp = require('temporary');
var archive = require('archiver');
var fs = require('fs');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

module.exports = function (grunt) {

    var DESC = 'creates package for aws lambda service';
    var DEFAULTS = {
        'dist_folder': 'dist',
        'include_time': true,
        'package_folder': './'
    };
    
    grunt.registerMultiTask('packaging', DESC, function () {

        var task = this;
        var opts = this.options(DEFAULTS);
        var done = this.async();
        var pkg = grunt.file.readJSON(path.resolve(DEFAULTS.package_folder + '/package.json'));
        var dir = { path: './dist/' };
        var now = new Date();
        var time_string = 'latest';
        var file_version = pkg.version.replace(/\./g, '-');
        var archive_name = pkg.name + '_' + file_version + '_' + time_string;
        
        npm.load([], function (err, npm) {

            npm.config.set('loglevel', 'silent');
            var install_location = dir.path;

            npm.commands.install(install_location, opts.package_folder, function () {

                var output = fs.createWriteStream(install_location + '/' + archive_name + '.zip');
                var zipArchive = archive('zip');
                zipArchive.pipe(output);

                zipArchive.bulk([
                    {
                        src: ['./**'],
                        expand: true,
                        cwd: install_location + '/node_modules/' + pkg.name
                    }
                ]);

                zipArchive.finalize();

                output.on('close', function () {
                    mkdirp('./' + opts.dist_folder, function (err) {
                        fs.createReadStream(install_location + '/' + archive_name + '.zip').pipe(
                            fs.createWriteStream('./' + opts.dist_folder + '/' + archive_name + '.zip')
                        );

                        rimraf(install_location, function () {

                            grunt.config.set('deployLambda.' + task.target + '.package',
                                './' + opts.dist_folder + '/' + archive_name + '.zip');

                            grunt.log.writeln('Created package at ' + opts.dist_folder + '/' + archive_name + '.zip');
                            done(true);
                        });
                    });
                });
            });
        });
    });
};
