import mongoose from 'mongoose';
import { Readable } from 'stream';

let gridfsBucket: mongoose.mongo.GridFSBucket;

export const initGridFS = () => {
  if (!mongoose.connection.db) {
    throw new Error('Database connection not established');
  }

  gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'cvs',
  });

  console.log('✅ GridFS initialized successfully');
};

export const getGridFSBucket = (): mongoose.mongo.GridFSBucket => {
  if (!gridfsBucket) {
    throw new Error('GridFS not initialized');
  }
  return gridfsBucket;
};

export const uploadFileToGridFS = (
  buffer: Buffer,
  filename: string,
  metadata?: any
): Promise<mongoose.Types.ObjectId> => {
  return new Promise((resolve, reject) => {
    const bucket = getGridFSBucket();
    const uploadStream = bucket.openUploadStream(filename, { metadata });

    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);

    readableStream.pipe(uploadStream);

    uploadStream.on('finish', () => {
      resolve(uploadStream.id as mongoose.Types.ObjectId);
    });

    uploadStream.on('error', (error) => {
      reject(error);
    });
  });
};

export const downloadFileFromGridFS = (
  fileId: mongoose.Types.ObjectId
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const bucket = getGridFSBucket();
    const chunks: Buffer[] = [];

    const downloadStream = bucket.openDownloadStream(fileId);

    downloadStream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    downloadStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    downloadStream.on('error', (error) => {
      reject(error);
    });
  });
};

export const deleteFileFromGridFS = async (
  fileId: mongoose.Types.ObjectId
): Promise<void> => {
  const bucket = getGridFSBucket();
  await bucket.delete(fileId);
};

export const getFileMetadata = async (
  fileId: mongoose.Types.ObjectId
): Promise<any> => {
  const bucket = getGridFSBucket();
  const files = await bucket.find({ _id: fileId }).toArray();

  if (files.length === 0) {
    throw new Error('File not found');
  }

  return files[0];
};

export const streamFileFromGridFS = (
  fileId: mongoose.Types.ObjectId
): mongoose.mongo.GridFSBucketReadStream => {
  const bucket = getGridFSBucket();
  return bucket.openDownloadStream(fileId);
};
