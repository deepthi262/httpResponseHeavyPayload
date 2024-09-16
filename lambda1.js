const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();
const { MongoClient } = require('mongodb');

// Replace the following with your MongoDB connection string
const dbName = 'sample_mflix';
const uri = `mongodb+srv://admin:admin@cluster0.jxw9b.mongodb.net/${dbName}?retryWrites=true&w=majority`; // Change to your MongoDB URI
let cachedDb = null;
 // Replace with your database name
const collectionName = 'users'; // Replace with your collection name
const { v4: uuidv4 } = require('uuid');
//const uuid = require('uuid');
const fs = require('fs');
/*


{
  "invocationType": "RequestResponse",
  "functionName": "aws-sam-lambda-lambda-app-one-Lambda2Function-IqRL2Fx2gh6z"
}

*/

exports.handler = async (event) => {
    console.log("Start of Lambda 1")
    console.log("Input Request", "event", JSON.stringify(event));
    const newUuid = uuidv4();
  console.log("invocation id", newUuid);
  event.invocationId = newUuid;
  const bucketName = 'mongo-to-s3-bucket';
    
    const invocationType = event.invocationType || 'RequestResponse'; // 'RequestResponse' for sync, 'Event' for async
    //const functionName = event.functionName;
    const params = {
        FunctionName: process.env.LAMBDA_2_NAME, // Replace with actual Lambda 2 name
        InvocationType: invocationType, // 'RequestResponse' for sync, 'Event' for async
        //Payload: JSON.stringify({ key1: 'Invoking from Lambda to Lambda', "invocationId":  newUuid}) // Add payload if necessary
    };

    let payload = {
        invocationId: newUuid
    };

    //console.log("params", JSON.stringify(params));

    try {
        const query = {};

        let recordCount = await getFlightCount(query);
            console.log(`Record count: ${recordCount}`);

        const uniqueString = generateUniqueJsonFileName(recordCount, newUuid);
    
        let response = await uploadFileToS3(bucketName, uniqueString, newUuid)
        .then(signedUrl => { console.log('Signed URL:', signedUrl); })
        .catch(err => { console.error('Error:', err); });
        //`lambda is invoked with Lambda Params :${JSON.stringify(params)}`;
        
        Object.assign(payload, { query, count: recordCount, FileName: uniqueString, folder: newUuid, bucketName : bucketName});
        params.Payload = JSON.stringify(payload);
        console.log('Updated params:', params);

        console.log("Before Lambda 2 invoked asynchronously with invocationId", newUuid);
        await lambda.invoke(params).promise();
        console.log("after Lambda 2 invoked asynchronously with invocationId", newUuid);
        return {
            statusCode: 202,
            body: JSON.stringify(response)
        };
        //}
    } catch (error) {
        console.error('Error invoking Lambda 2:', error);
        throw error;
    }
};

async function uploadFileToS3(bucketName, uniqueString, newUuid) {
    
    const filePath = `${newUuid}/${uniqueString}`;


    const params = {
        Bucket: bucketName,
        Key: filePath,
        Body: JSON.stringify({}),
        ContentType: 'text/plain'
    };
    
    try {
        await s3.putObject(params).promise();
        console.log(`Empty JSON file created at: s3://${bucketName}/${filePath}`);
    } catch (err) {
        console.error('Error creating JSON file in S3:', err);
    }

// Generate pre-signed URL
const urlParams = {
    Bucket: bucketName,
    Key: filePath,
    Expires: 60 * 5 // URL valid for 5 minutes
};

const signedUrl = s3.getSignedUrl('getObject', urlParams);

return signedUrl;
}

async function getFlightCount(query) {
    const client = new MongoClient(uri);
    const db = client.db(dbName);
    const flightCollection = db.collection(collectionName);
  
    try {
      const count = await flightCollection.countDocuments(query);
      return count;
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      client.close();
    }
  }
  


function generateUniqueJsonFileName(recordCount, newUuid) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-based
    const date = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    const uniqueString = `${newUuid}_${recordCount}_${year}_${month}_${date}_${hours}_${minutes}_${seconds}_${milliseconds}.json`;

    return uniqueString;
 
}

