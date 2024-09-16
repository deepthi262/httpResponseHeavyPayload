```
{
  "invocationType": "RequestResponse",
  "functionName": "aws-sam-lambda-lambda-app-one-Lambda2Function-IqRL2Fx2gh6z"
}
```


```
sam local invoke FirstLambda --event events/firstLambdaEvent.json
sam local invoke SecondLambda --event events/secondLambdaEvent.json
```

```
sam clean
```
```
sam build
```

Before executing below command, created the s3bucket in aws console - in the region that you are working
```
sam deploy --s3-bucket aws-sam-deploy-s3-bucket
```
```
sam deploy --guided --s3-bucket aws-sam-deploy-s3-bucket
```
