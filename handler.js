'use strict';

const AWS = require('aws-sdk');
const uuid = require("uuid");

const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const rek = new AWS.Rekognition();

module.exports.getFiles = async (event, context) => { //get all files in bucket
  return s3.listObjects({Bucket: process.env.BUCKET }, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred           
  }).promise()
};


module.exports.imageRekognition = async  (event, context) => { //run rekognition in s3 image
    const params = {
        Image: {
          S3Object: {
            Bucket: event.bucket,
            Name: event.imageName,
          },
        },
        MaxLabels: 10,
        MinConfidence: 50,
      };

      console.log(`Recognizing file: https://s3.amazonaws.com/${event.bucket}/${event.imageName}`);
      return rek.detectLabels(params).promise();
};

  module.exports.saveToDB = async (event, context) => { //save info in DynamoDB
    const resource = require("./handler") //getting reference for the other services created

    const filesResults = await resource.getFiles()

    let jsonFile = JSON.parse(JSON.stringify(filesResults)).Contents

    let items = []
    
    for(let i=0; i < jsonFile.length; i++) {
   
      //get rekognition for each file
      const analysis = await resource.imageRekognition({bucket: process.env.BUCKET, imageName: jsonFile[i].Key})
     
     //log of all results from each image from rekognition
      console.log(analysis)

      //add info to add in DynamoDB
      items.push({
        PutRequest: {
          Item: {
            id: uuid.v1(),
            pictureLink:  `https://${process.env.BUCKET}.s3.amazonaws.com/${jsonFile[i].Key}`,
            description: JSON.stringify(analysis.Labels[1].Name)
          }
        }
      })
    }

    //get table name
    const table = process.env.TABLE

    let params = {
      RequestItems: {
        [table]: items
      }
    };   
    
    //save all files in dynamo
    return dynamoDB.batchWrite(params, function(err, data) {
      if (err) console.log(err, err.stack);
    }).promise();
}
