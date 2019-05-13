// This Lambda Function will check DynamoDB to set up a DID for a call flow

// Load the SDK for JavaScript
var AWS = require("aws-sdk");
AWS.config.apiVersions = {
    connect: '2017-08-08',
    // other service API versions
};

// Create DynamoDB document client. To access DynamoDB you need to create an AWS.DynamoDB.DocumentClient object.
var docClient = new AWS.DynamoDB.DocumentClient();
var connect = new AWS.Connect();

exports.handler = async (event) => {

    var qName = "BasicQueue";

    console.log("Connect Event:" + JSON.stringify(event));



    var getQuery = () => {
        return new Promise((resolve, reject) => {
            let returnResult = {};
            var paramsQuery = {
                TableName: 'QueueDetails',
                IndexName: 'QueueName-index',
                KeyConditionExpression: "QueueName = :qName",

                ExpressionAttributeValues: {
                    ":qName": qName
                }
            };
            docClient.query(paramsQuery, function (err, data) {
                if (err) {
                    console.log(err); // an error occurred
                    reject(err);
                } else {
                    console.log("Number of returned items from DynamoDB: " + data.Items.length);
                    console.log("DynamoDB Query Results:" + JSON.stringify(data));

                    var i = 0; //while loop counter

                    if (data.Items.length > 0) {

                        console.log("ID :" + data.Items[i].ID);
                        console.log("QueueNames:" + data.Items[i].QueueName);
                        console.log("QueueARN:" + data.Items[i].QueueARN);
                        //returnResult.ID = data.Items[i].ID;
                        //returnResult.QueueName = data.Items[i].QueueName; //Initialise
                        //returnResult.Queue = data.Items[i].QueueARN; //Iniitalise
                        //returnResult.InstanceARN = data.Items[i].InstanceARN;
                        returnresult = getCurrentQueueDetails(data.Items[i].QueueARN, data.Items[i].InstanceARN);
                    } else {
                        returnResult.lambdaResult = "Fail"; // initialise
                    }
                    console.log("Return Result: " + JSON.stringify(returnResult));
                    resolve(returnResult);
                }

            });
        });
    };

    return await getQuery();
};



function getCurrentQueueDetails(QueueARN, InstanceARN) {
    var returnData = {};
    var METRIC_DATA = {
        "InstanceId": InstanceARN,
        "Filters": {
            "Queues": [QueueARN],
            "Channels": ["VOICE"]
        },
        "Groupings": [
            "CHANNEL",
            "QUEUE"
        ],
        "CurrentMetrics": [
            {
                "Name": "AGENTS_ONLINE",
                "Unit": "COUNT"
            },
            {
                "Name": "AGENTS_AVAILABLE",
                "Unit": "COUNT"
            },
            {
                "Name": "OLDEST_CONTACT_AGE",
                "Unit": "SECONDS"
            },
            {
                "Name": "AGENTS_ERROR",
                "Unit": "COUNT"
            }
        ]
    };
    connect.getCurrentMetricData(METRIC_DATA, function (err, data) {
        if (err) 
        {
            console.log(err, err.stack); // an error occurred

        }        
         else {
            var obj = JSON.parse(data);
            returnData.AGENTS_ONLINE = obj.MetricResults[0].Collections[0].Value;
            returnData.AGENTS_AVAILABLE = obj.MetricResults[0].Collections[1].Value;
            returnData.OLDEST_CONTACT_AGE = obj.MetricResults[0].Collections[2].Value;
            returnData.AGENTS_ERROR = obj.MetricResults[0].Collections[3].Value;
            console.log("Data returned for Queue ::" + JSON.stringify(returnData));

        }// successful response
    });
    return returnData;
}