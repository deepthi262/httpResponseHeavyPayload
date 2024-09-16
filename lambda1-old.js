const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();
const { MongoClient } = require('mongodb');

// Replace the following with your MongoDB connection string
const uri = 'mongodb://localhost:27017'; // Change to your MongoDB URI
const dbName = 'mydb'; // Replace with your database name
const collectionName = 'customers'; // Replace with your collection name
const { v4: uuidv4 } = require('uuid');
const uuid = require('uuid');
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
//     const newUuid = uuidv4();
//   console.log("invocation id", newUuid);
//   event.invocationId = newUuid;
  const bucketName = 'mongo-to-s3-bucket';
    
    const invocationType = event.invocationType || 'RequestResponse'; // 'RequestResponse' for sync, 'Event' for async
    //const functionName = event.functionName;
    const params = {
        FunctionName: process.env.LAMBDA_2_NAME, // Replace with actual Lambda 2 name
        InvocationType: invocationType, // 'RequestResponse' for sync, 'Event' for async
        Payload: JSON.stringify({ key1: 'Invoking from Lambda to Lambda', "invocationId":  newUuid}) // Add payload if necessary
    };
    console.log("params", JSON.stringify(params));

    try {
        const query = {};
          

        let recordCount = await getFlightCount(query).then((count) => {
            console.log(`Record count: ${count}`);
          });

        createJsonFile(recordCount, {});

        


          
        


        let response = uploadFileToS3(bucketName, recordCount)
        .then(signedUrl => { console.log('Signed URL:', signedUrl); })
        .catch(err => { console.error('Error:', err); });
        //`lambda is invoked with Lambda Params :${JSON.stringify(params)}`;

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

async function uploadFileToS3(bucketName, noOfRecordsMongoDBToS3) {
    const uniqueString = generateUniqueString(noOfRecordsMongoDBToS3);
    const fileName = `${uniqueString}.json`;

    const fileContent = `This is a sample file with the unique string: ${uniqueString}`;

    const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: fileContent,
        ContentType: 'text/plain'
    };

// Upload file to S3
await s3.putObject(params).promise();

// Generate pre-signed URL
const urlParams = {
    Bucket: bucketName,
    Key: fileName,
    Expires: 60 * 5 // URL valid for 5 minutes
};

const signedUrl = s3.getSignedUrl('getObject', urlParams);

return signedUrl;
}


function generateUniqueString(noOfRecordsMongoDBToS3) { const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-based
    const date = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    const uniqueString = `${uuidv4()}_${noOfRecordsMongoDBToS3}_YYY_${year}_${month}_${date}_${hours}_${minutes}_${seconds}_${milliseconds}`;

    return uniqueString;
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
  


function generateUniqueJsonFileName(recordCount) {
  const timestamp = Date.now();
  const uuidString = uuid.v4();
  return `${uuidString}_${recordCount}_${timestamp}.json`;
}

function createJsonFile(recordCount, data) {
  const uniqueFileName = generateUniqueJsonFileName(recordCount);
  fs.writeFileSync(uniqueFileName, JSON.stringify(data, null, 2));
  console.log(`JSON file created: ${uniqueFileName}`);
}

// Example usage:
const recordCount = 10;
const data = {
  records: [
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' },
    // ...
  ]
};
createJsonFile(recordCount, data);




// 3; GetRecordCount(QueryString)
// function (QueryString){

//     return count;
// }

// 4: generatename()
// Input; UUId, TotalRecordCount, TimeStamp
// function generatename(UUId, TotalRecordCount){
//     return fileName;
// }

// 5: Create FileInS3
// function createFolderFileInS3(fileName){

// }
// 6; call ExternalLambda
// function callLambda2(query, filename){

// }
// 7; GenerateSignedURL
// function GenerateSignedURL(filename,bucketname){
//     return signedURL;
// }



let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        // Reuse existing database connection
        return cachedDb;
    }
    
    const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    
    await client.connect();
    cachedDb = client.db('<dbname>');  // Replace <dbname> with your database name
    return cachedDb;
}

exports.handler = async (event) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('your-collection-name');  // Replace with your collection
        
        // Perform operations (e.g., find documents)
        const documents = await collection.find({}).toArray();
        
        return {
            statusCode: 200,
            body: JSON.stringify(documents),
        };
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error connecting to database' }),
        };
    }
};


// const cursor = collection.find({});
//     const s3Stream = s3.upload({
//         Bucket: bucketName,
//         Key: fileName,
//         Body: cursor.stream()  // Streaming MongoDB data to S3
//     }).promise();

//     await s3Stream;
//     console.log(`File ${fileName} uploaded to ${bucketName}`);
/*
async function uploadFileToS3(bucketName, recordCount, collection) {
  const uniqueString = generateUniqueJsonFileName(recordCount);
  const fileName = `${uniqueString}.json`;

  // Stream MongoDB cursor directly to S3
  const cursor = collection.find({});
  const s3Stream = s3.upload({
      Bucket: bucketName,
      Key: fileName,
      Body: cursor.stream()  // Streaming MongoDB data to S3
  }).promise();

  await s3Stream;
  console.log(`File ${fileName} uploaded to ${bucketName}`);

  // You can return the S3 file URL here, or generate a presigned URL.
  const signedUrl = await s3.getSignedUrlPromise('getObject', {
      Bucket: bucketName,
      Key: fileName,
      Expires: 60 * 60  // Link expires in 1 hour
  });
  
  return signedUrl;
}
  */
 