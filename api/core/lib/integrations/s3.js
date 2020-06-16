import fs from 'fs';
// import path from 'path';
import Promise from 'bluebird';
import AWS from 'aws-sdk';

import Config from '../../../config/config';
import Log from '../utils/log';
import { GeneralUtil } from '../utils/general';

const { To } = GeneralUtil;

const EXPIRES_MINS = 10;
const LOG_NAME = 'S3API';

class S3API {
  static instance = null;

  static create() {
    this.instance = this.instance == null ? new S3API() : this.instance;
    return this.instance;
  }

  constructor() {
    this.log = Log.getLogger(LOG_NAME);
    this.config = Config.get('S3');
    const aws = Config.get('AWS');

    AWS.config.update({
      accessKeyId: aws.accessKeyId,
      secretAccessKey: aws.secretAccessKey,
      region: this.config.region,
    });

    const config = {};
    const { apiVersion, signatureVersion } = this.config;
    if (apiVersion && apiVersion.length) {
      config.apiVersion = apiVersion;
    }
    if (signatureVersion && signatureVersion.length) {
      config.signatureVersion = signatureVersion;
    }

    this.client = new AWS.S3(config);
  }

  static getFileKey(filePath) {
    return filePath;
  }

  getBucketName(name = undefined) {
    return name || this.config.bucketName;
  }

  async uploadFile(filePath, bucket = undefined, options = {}, getKeyFunc = undefined) {
    const defaults = {
      deleteAfter: true,
      isPublic: false,
      contentType: null,
    };

    const opts = { ...defaults, ...options };

    if (getKeyFunc === undefined) {
      throw new Error('getKeyFunc');
    }

    const params = {
      Bucket: this.getBucketName(bucket),
      Body: fs.createReadStream(filePath),
      Key: getKeyFunc(filePath),
    };

    if (opts.isPublic) {
      params.ACL = 'public-read';
    }

    if (opts.contentType) {
      params.ContentType = opts.contentType;
    }

    const data = await this.client.upload(params).promise();
    if (options.deleteAfter) {
      // delete after
      const unlinkAsync = Promise.promisify(fs.unlink);
      await unlinkAsync(filePath);
      this.log.debug('uploadFile - temp file deleted');
    }

    return data;
  }

  async uploadStream(stream, key, bucket = undefined, options = {}) {
    const defaults = {
      isPublic: false,
      contentType: null,
    };

    const opts = { ...defaults, ...options };

    const params = {
      Bucket: this.getBucketName(bucket),
      Body: stream,
      Key: key,
    };

    if (opts.isPublic) {
      params.ACL = 'public-read';
    }

    if (opts.contentType) {
      params.ContentType = opts.contentType;
    }

    return this.client.upload(params).promise();
  }

  uploadByRequest(req, bucket = undefined) {
    const {
      file,
    } = req.files;
    return this.uploadFile(file.path, bucket);
  }

  async downloadFile(fileKey, dstFilePath, bucket = undefined) {
    const params = {
      Bucket: this.getBucketName(bucket),
      Key: fileKey,
    };

    const response = await this.client.getObject(params).promise();
    const buf = Buffer.from(response.Body.toString());
    const writeFileAsync = Promise.promisify(fs.writeFile);
    await writeFileAsync(dstFilePath, buf);
    return dstFilePath;
  }

  async downloadBinaryFile(fileKey, dstFilePath, bucket = undefined) {
    const params = {
      Bucket: this.getBucketName(bucket),
      Key: fileKey,
    };

    const response = await this.client.getObject(params).promise();
    const buf = Buffer.from(response.Body).toString('binary');
    const writeFileAsync = Promise.promisify(fs.writeFile);
    await writeFileAsync(dstFilePath, buf, 'binary');
    return dstFilePath;
  }

  downloadFileToRequest(fileKey, fileName, res, bucket = undefined) {
    return new Promise((resolve, reject) => {
      const options = {
        Bucket: this.getBucketName(bucket),
        Key: fileKey,
      };

      res.attachment(fileName);
      return this.client.getObject(options)
        .createReadStream()
        .on('error', (err) => reject(err))
        .on('end', () => resolve(fileName))
        .pipe(res);
    });
  }


  deleteFilesArray(keys, bucket = undefined) {
    const objs = keys.map((val) => ({
      Key: val,
    }));

    return this.deleteFiles(objs, bucket);
  }

  deleteFiles(keys, bucket = undefined) {
    return new Promise((resolve, reject) => {
      let objs = 'Contents' in keys ? keys.Contents : keys;

      objs = objs.map((val) => ({
        Key: val.Key,
      }));

      const params = {
        Bucket: this.getBucketName(bucket),
        Delete: {
          Objects: objs,
        },
      };

      this.client.deleteObjects(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  deleteFile(key, bucket = undefined) {
    return this.deleteFilesArray([key], bucket);
  }

  listFiles(bucket, opts = {}) {
    const params = {
      ...opts,
      Bucket: this.getBucketName(bucket),
    };
    return new Promise((resolve, reject) => {
      this.client.listObjects(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  listBucket() {
    return new Promise((resolve, reject) => {
      this.client.listBuckets((err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data.Buckets);
        }
      });
    });
  }

  async createBucket(bucket = undefined, isPublic = false) {
    const params = {
      Bucket: this.getBucketName(bucket),
    };

    if (isPublic) {
      params.ACL = 'public-read';
    }

    try {
      const [err, exists] = await To(this.bucketExists(params.Bucket));
      if (!err) {
        this.log.info('createBucket exists=%j', exists);
        return exists;
      }

      // await this.client.waitFor('bucketNotExists', params).promise();

      params.CreateBucketConfiguration = {
        LocationConstraint: this.config.region,
      };

      const result = await this.client.createBucket(params).promise();
      delete params.CreateBucketConfiguration;
      await this.client.waitFor('bucketExists', params).promise();

      return result.Location;
    } catch (err) {
      this.log.error('createBucket err=%j', err);
      throw err;
    }
  }

  deleteBucket(bucket = undefined) {
    const params = {
      Bucket: this.getBucketName(bucket),
    };

    return new Promise((resolve, reject) => {
      this.client.deleteBucket(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          this.client.waitFor('bucketNotExists', params, (errNotExist, dataNotExist) => {
            this.log.debug('deleteBucket: dataNotExist=%j', dataNotExist);
            if (errNotExist) {
              reject(errNotExist);
            } else {
              resolve(data);
            }
          });
        }
      });
    });
  }

  bucketExists(bucket = undefined) {
    const params = {
      Bucket: this.getBucketName(bucket),
    };

    return this.client.headBucket(params).promise();
  }

  // create signed url item / invoices or shipping label
  async getSignedUrl(key, bucket = undefined, expires = EXPIRES_MINS * 60) {
    const params = {
      Bucket: this.getBucketName(bucket),
      Key: key,
    };

    const headCode = await this.client.headObject(params).promise();
    this.log.debug('getSignedUrl: %j', headCode);
    params.Expires = expires;
    const signedUrl = this.client.getSignedUrl('getObject', params);
    return signedUrl;
  }
}

module.exports = {
  S3API,
  createInstance: () => S3API.create(),
};
