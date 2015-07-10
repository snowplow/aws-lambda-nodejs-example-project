var grunt = require('grunt');
var async = require('async'); 

grunt.initConfig({
    dynamo: {
        default: {
            function: 'dynamo'
        }
    },
    createRole: {
        default: {
            function: 'createRole'
        }
    },
    kinesis: {
        default: {
            function: 'kinesis'
        }
    },
    attachRole: {
        default: {
            function: 'attachRole'
        }
    },
    packaging: {
        default: {
            function: 'packaging'
        }
    },
    deployLambda: {
        default: {
            function: 'deployLambda'
        }
    },
    associateStream: {
        default: {
            function: 'associateStream'
        }
    },
    generateEvents: {
        default: {
            function: 'generateEvents'
        }
    }
});

grunt.loadTasks('tasks');
grunt.registerTask('init', ['dynamo','createRole','kinesis']);
grunt.registerTask('role', ['attachRole','packaging']);
grunt.registerTask('deploy', ['deployLambda']);
grunt.registerTask('connect', ['associateStream']);
grunt.registerTask('events', ['generateEvents']);


