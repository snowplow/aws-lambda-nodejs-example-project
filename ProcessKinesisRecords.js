/*
 * Copyright (c) 2015 Snowplow Analytics Ltd. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the Apache License Version 2.0 is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Apache License Version 2.0 for the specific language governing permissions and limitations there under.
 */

console.log('Loading ProcessKinesisRecordsDynamoDB function');

var aws = require('aws-sdk');
var _ = require('lodash');
var table = new aws.DynamoDB({params: {TableName: 'my-table'}});

// first record processing function called by export.handler
exports.kinesisHandler = function(records, context) {

    // process kinesis records
    var data = records
        .map(function(record) {
            return new Buffer(record.kinesis.data, 'base64').toString('utf8');
        });
    // downsample aggregate
    var aggData = _.chain(data)
        .map(aggregateData)
        .groupBy(aggData, function(singleRecord) { return singleRecord.Timestamp })
        .sortBy('Timestamp')
        .value();
    // count events    
    var countedObject =  _.chain(aggData[0])
        .map(function(item) {
            return item.Timestamp + ' ' + item.EventType;
        })
        .countBy(_.identity)
        .value();
    // write to dynamodb using strings _NOT_ATOMIC
    _.forEach(countedObject, function(count, keys) {
        var params = transformData(keys.split(" ")[0], keys.split(" ")[1], count);
        updateDynamoDB(params, function () {
            context.done(null, 'Added to DynamoDB');
        });
    });

    ///////////////////////////////helper functions ////////////////////////////////

    // update item to DynamoDB
    function updateDynamoDB (params, callback) {
        table.updateItem(params, function (err, data) {
            if (err) console.log(err, err.stack);
            else console.log(data);
            callback();
        });
    }

    // creating records objects to sort
    function aggregateData(payload) {
        var datum = JSON.parse(payload);
        var timestampItem = datum.timestamp;
        var typeItem = datum.type;
        var parsedDate = new Date(timestampItem);
        var singleRecord = {    
            'Timestamp': downsample(parsedDate),
            'EventType': typeItem,            
            'CreatedAt': timestampItem,
            'UpdatedAt': new Date().toISOString(),
            'Count':     '1'
        }
        return singleRecord;
    }

    // create records for insert into dynamodb
    function transformData(itemTimestamp, itemEventType, count) {

        var params = {
            Key: {
                'Timestamp': {'S': itemTimestamp},
                'EventType': {'S': itemEventType}
            },
            AttributeUpdates: {
                'CreatedAt': {'Value': {'S': new Date().toISOString() },'Action':'PUT'},
                'UpdatedAt': {'Value': {'S': new Date().toISOString() },'Action':'PUT'},
                'Count':     {'Value': {'N': count.toString() },'Action':'ADD'}
            }
        }
        return params;
    }

    // manual check of UTC build zero adder
    function pad(number) {
        var r = String(number);
        if ( r.length === 1 ) {
            r = '0' + r;
        }
        return r;
    }

    // downsample function for creating metadata
    function downsample(dateObject) {
        return dateObject.getUTCFullYear()
            + '-' + pad( dateObject.getUTCMonth() + 1 )
            + '-' + pad( dateObject.getUTCDate() )
            + 'T' + pad( dateObject.getUTCHours() )
            + ':' + pad( dateObject.getUTCMinutes() )
            + ':' + '00.000';
    }
    context.done();
};

// main function
exports.handler = function(event, context) {
    var record = event.Records[0];
    if (record.kinesis) {
        exports.kinesisHandler(event.Records, context);
    }
};
