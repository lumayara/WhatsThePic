<!--
title: 'Serverless Create Lambda, S3 and Dynamo'
description: 'Build a serverless framework (serverless.com) deployment that creates a Lambda, an S3 bucket, and a Dynamo DB table and uploads a file to your bucket. Then, write a plugin that invokes the Lambda after the deployment, extracts data from the file in S3 and inserts that data into DynamoDB. 
Serverless Framework creates the Lambda function, a S3 bucket called whatpicisit2020, and a DynamoDB table (picTable) then it uploads a couple of pictures that are inside a images file. After I run serverless deploy, my lambda function is invoked and it transfer the information of my picture in the buckets (the link) to Dynamo and it also calls for AWS Rekognition and it also saves the results in the description field in Dynamo'
layout: Doc
framework: v1
platform: AWS
language: nodeJS
authorLink: 'https://github.com/lumayara'
authorName: 'Luana Fernandes'
-->
# Create Lambda, S3 and Dynamo DB resource and upload images with Serverless Framework plus transfer  images data from S3 to Dynamo and add Rekognition to the images

This example uses serverles framework deployment to create a Lambda, an S3 bucket, and a Dynamo DB table and uploads a file to my bucket. My lambda function is invoked and it transfer the information of my picture in the buckets (the link) to Dynamo and it also calls for AWS Rekognition and it also saves the results in the description field in Dynamo'

## Use-cases

- Create resources: S3, Lambda and DynamoBD
- Get and Transfer Data/Info from S3 to Dynamo
- Use Rekognition from S3 and store in Dynamo

## How it works

We first Create Resources with Serverles:

`Lambda`
```functions:
  getFiles:
    handler: handler.getFiles
    environment:
      BUCKET: ${self:custom.bucket}
  saveToDB:
    handler: handler.saveToDB
    environment:
      BUCKET: ${self:custom.bucket}
      TABLE: ${self:custom.table}
  imageRekognition:
    handler: handler.imageRekognition
```

`S3`
```Resources:
  Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: ${self:custom.bucket}
  MyBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
        Bucket: !Ref Bucket
        PolicyDocument:
          Statement:
            - Effect: Allow
              Principal: '*'
              Action: s3:GetObject
              Resource: 'arn:aws:s3:::${self:custom.bucket}/*'
```

`DynamoDB`
```Resources:
  picTable: 
    Type: AWS::DynamoDB::Table
    # DeletionPolicy: Retain 
    Properties:
      TableName: ${self:custom.table}
      AttributeDefinitions:
        - AttributeName: pictureLink
          AttributeType: S
        - AttributeName: description
          AttributeType: S
      KeySchema:
        - AttributeName: pictureLink
          KeyType: HASH
        - AttributeName: description
          KeyType: RANGE
      # Set the capacity to auto-scale
      BillingMode: PAY_PER_REQUEST
```


## Setup

After downloading this plugin, run:

```
npm install
```

Change the name of the bucket in `serverless.yml` and make sure it's an unique name because if it already exists, it won't work, you can try deploying with the current name. Change the name in:

```yml
custom:
  bucket: <insert-bucket-name>
```

## Deploy

In order to deploy the you endpoint simply run

```
serverless deploy
```

The last line should be:

```
Serverless:  - Done!
```

## Usage

You can now use Rekognition to get images description and the link to the image in S3 in a table in Dynamo. Invoke saveToDB function.

```bash
serverless invoke --function saveToDB --log
```

The expected result should be similar to:

```bash
{
    "UnprocessedItems": {}
}
```
It will also print the results from Rekognition from each image

You can delete the stack and deployment running:
```serverless remove
```
