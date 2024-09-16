
# AWS Node.js Lambda to Lambda Execution with Synchronous and Asynchronous Invocation

This project demonstrates how to invoke one AWS Lambda function from another using Node.js and the AWS SDK, with two different options:
- Option 1: Invoke Lambda 2 and wait for the response (Synchronous invocation).
- Option 2: Invoke Lambda 2 but do not wait for the response (Asynchronous invocation). Return the execution ID.

## Setup Instructions

### Prerequisites
1. AWS CLI configured with appropriate permissions.
2. Node.js installed on your local machine.
3. AWS SAM CLI installed on your local machine.

### Steps

1. **Install Dependencies**  
   Each Lambda function requires the AWS SDK. The `aws-sdk` comes preinstalled in AWS Lambda environments, but locally you may need to install it for testing. Run this in each Lambda's directory:
   ```bash
   npm install
   ```

2. **Deploy the Lambda Functions using AWS SAM**

   - First, build and deploy the Lambda functions using AWS SAM:
     ```bash
     sam build
     sam deploy --guided               //sam deploy --s3-bucket aws-sam-deploy-s3-bucket-deep
     ```

   - Follow the prompts and provide the necessary information, such as stack name, region, etc. Once deployed, note the Lambda 1 and Lambda 2 ARNs from the output.

3. **Set Permissions**
   The SAM template includes the necessary permissions for Lambda 1 to invoke Lambda 2. No further permission changes are needed.

4. **Test the Setup**
   Trigger Lambda 1 using a test event from the AWS Lambda console. It should invoke Lambda 2 either synchronously or asynchronously depending on the option chosen.

## Code Explanation

### Lambda 1 - Invoker
This function provides two options for invoking Lambda 2:
1. **Synchronous Invocation (Wait for response)**
2. **Asynchronous Invocation (Don't wait, return execution ID)**

```javascript
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();

exports.handler = async (event) => {
    const invocationType = event.invocationType || 'RequestResponse'; // 'RequestResponse' for sync, 'Event' for async
    const params = {
        FunctionName: process.env.LAMBDA_2_NAME, // Lambda 2 name passed via environment variable
        InvocationType: invocationType, // 'RequestResponse' for sync, 'Event' for async
        Payload: JSON.stringify({ key1: 'value1' }) // Add payload if necessary
    };

    try {
        if (invocationType === 'RequestResponse') {
            // Synchronous invocation, wait for response
            const response = await lambda.invoke(params).promise();
            console.log('Lambda 2 response:', response);
            return response;
        } else {
            // Asynchronous invocation, return execution ID
            const response = await lambda.invoke(params).promise();
            console.log('Lambda 2 invoked asynchronously, execution ID:', response.ResponseMetadata.RequestId);
            return {
                statusCode: 202,
                body: JSON.stringify({ executionId: response.ResponseMetadata.RequestId })
            };
        }
    } catch (error) {
        console.error('Error invoking Lambda 2:', error);
        throw error;
    }
};
```

### Lambda 2 - Responder
This function is invoked by Lambda 1 and returns a response.

```javascript
exports.handler = async (event) => {
    console.log('Lambda 2 invoked with event:', event);
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Lambda 2 executed successfully!' })
    };
};
```

## Local Testing

You can run Lambda 1 locally using the following command after installing dependencies:
```bash
node index.js
```
Ensure you have the correct AWS credentials configured locally for testing.







1: S3 Bucket is HardCoded( MongoTOS3-Bucket)
2: Generation UUID( getUUID())
function generateUUID(){
    return uuid.v4();

}

3; GetRecordCount(QueryString)
function (QueryString){

    return count;
}

4: generatename()
Input; UUId, TotalRecordCount, TimeStamp
function generatename(UUId, TotalRecordCount){
    return fileName;
}

5: Create FileInS3
function createFolderFileInS3(fileName){

}
6; call ExternalLambda
function callLambda2(query, filename){

}
7; GenerateSignedURL
function GenerateSignedURL(filename,bucketname){
    return signedURL;
}
8Return SignedURL and UUID
