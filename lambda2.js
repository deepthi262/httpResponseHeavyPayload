const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();
const { MongoClient } = require('mongodb');
const fs = require('fs');
// Replace the following with your MongoDB connection string
const dbName = 'sample_mflix';
const uri = `mongodb+srv://admin:admin@cluster0.jxw9b.mongodb.net/${dbName}?retryWrites=true&w=majority`; // Change to your MongoDB URI
const compFolder = "AppConfig";
const compFile = ".complete";
// Replace with your database name
// Replace with your collection name
exports.handler = async (event) => {

  try {
    console.log('Lambda 2 invoked with event:', event);
    console.log('Start of Execution:', new Date().toISOString(), "invocationId", event.invocationId);
    const collectionName = 'users';
    // event: {
    //     invocationId: '337590cd-9e22-4db7-aa2a-54d2729f3ecd',
    //     query: {},
    //     count: 185,
    //     FileName: '337590cd-9e22-4db7-aa2a-54d2729f3ecd_185_2024_09_13_06_05_05_298.json',
    //     folder: '337590cd-9e22-4db7-aa2a-54d2729f3ecd',
    //     bucketName: 'mongo-to-s3-bucket'
    //   }

    const query = event.query;
    const count = event.count;
    const FileName = event.FileName;
    const folder = event.folder;
    const bucketName = event.bucketName;

    // Fetch flight data based on the event query
    const actualFileContent = await getFlighData(query, dbName, collectionName, count);

    // Upload the fetched data to S3
    await uploadFileToS3(actualFileContent, bucketName, folder, FileName);

    await copyCompleteFileToFolder(bucketName, folder);

    // Return a success response
    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Lambda 2 executed successfully! ${new Date().toISOString()}` }),
    };
  } catch (error) {
    // Handle errors and return an error response
    console.error('Error executing Lambda 2:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error executing Lambda 2', error: error.message }),
    };
  }
};


async function getFlighData(query, dbName, collectionName, count) {
  const client = new MongoClient(uri);
  try {
   
    maxPages = 20;
    let currentPage = 0;
    let hasMore = true;
    const filePath = '/tmp/output.json';  // File path in Lambda's /tmp directory
    await client.connect();
    const db = client.db(dbName);
    const flightCollection = db.collection(collectionName);
    const pageSize = Math.ceil(count/maxPages);
    // Ensure the file is empty/created before starting
    fs.writeFileSync(filePath, '[');  // Start JSON array

    while (hasMore && currentPage < maxPages) {
      const documents = await flightCollection
        .find(query)
        .skip(currentPage * pageSize)
        .limit(pageSize)
        .toArray();

      if (documents.length === 0) {
        hasMore = false;
        break;
      }

      // Append data to the file
      fs.appendFileSync(filePath, JSON.stringify(documents, null, 2));
      if (currentPage < maxPages - 1) {
        fs.appendFileSync(filePath, ',');  // Add comma between batches
      }

      console.log(`Page ${currentPage + 1} fetched and written to file.`);
      currentPage++;
      hasMore = currentPage * pageSize < count;
    }

    // End the JSON array in the file
    fs.appendFileSync(filePath, ']');

    return filePath;
  } catch (err) {
    console.error(err);
    return null;
  } finally {
    client.close();
  }
}

async function uploadFileToS3(filePath, bucketName, folder, fileName) {
  const fileStream = fs.createReadStream(filePath);
  const s3Key = `${folder}/${fileName}`;
  const s3Params = {
    Bucket: bucketName,
    Key: s3Key,
    Body: fileStream,
  };

  return s3.upload(s3Params).promise();
};


async function copyCompleteFileToFolder(bucketName,folder) {
  const newFileName = `${folder}.complete`;
  const sourceKey = `${compFolder}/${compFile}`; // Path to the file in the source folder

// Dynamically generate the destination folder name and new file name
const destinationKey = `${folder}/${newFileName}`; // Destination path with new file name

  console.log("in copy complete");
  console.log(` source is : ${sourceKey},  destination is ${destinationKey} `);
  const copyParams = {
    Bucket: bucketName,
    CopySource: `${bucketName}/${sourceKey}`,
    Key: destinationKey
};

await s3.copyObject(copyParams).promise();
console.log(`Signal file copied `);

};