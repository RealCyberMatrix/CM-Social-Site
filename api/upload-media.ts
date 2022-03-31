import type { VercelRequest, VercelResponse } from '@vercel/node';
import { S3Client, PutObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3';
import multiparty from 'multiparty';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const s3Client: S3Client = new S3Client({ 
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID_CYBER,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_CYBER,
  }
});

export default async (request: VercelRequest, response: VercelResponse) => {

  if ( request.method == 'POST' ) {

    const form = new multiparty.Form();

    form.parse(request, async (error, fields, bytes) => {
      console.log('error: ', error);
      console.log('fields:', fields);
      // console.log('files', bytes.file);
      console.log('amount', fields.amount);
      console.log('name', fields.name);
      console.log('description', fields.description);


      const f = fs.readFileSync(bytes.file[0].path)

      try {
        // 1. upload nft image/video
        const uploadParamsForAsset = {
          Bucket: process.env.S3_BUCKET,
          Key: process.env.S3_SAVE_PATH + `${bytes.file[0].originalFilename}`,
          Body: f,
          ACL: 'public-read',
          ContentType: bytes.file[0].headers['content-type'],
        };
        let res = await s3Client.send(new PutObjectCommand(uploadParamsForAsset));
        console.log('Success', res);

        // 2. create metadata and save it in s3 as well
        const metadata = {
          name: fields.name? fields.name[0] : '',
          description: fields.description? fields.description[0] : '',
          assetUrl: process.env.S3_BUCKET_DOMAIN + uploadParamsForAsset.Key,
        }

        const metadataKey = uuidv4() + '.json';

        const uploadParamsForMetadata = {
          Bucket: process.env.S3_BUCKET,
          Key: (process.env.S3_SAVE_PATH ? process.env.S3_SAVE_PATH : '') + metadataKey, // ex. folder/meta.json
          Body: JSON.stringify(metadata),
          ACL: 'public-read',
          ContentType: 'application/json',
        };

        res = await s3Client.send(new PutObjectCommand(uploadParamsForMetadata));
        console.log('Success', res);

        response.status(201).send({ 
          metadata: metadata,
          metadataKey: metadataKey,
        });
      } catch (err) {
        console.log(err);
        response.status(500).send({ mssg: 'failed to upload to s3.' }); 
      }
    });

  } else {
    response.status(500).send({ mssg: 'failed to upload to s3.' });  
  }
  

  
  
};