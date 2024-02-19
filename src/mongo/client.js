import { config } from 'dotenv';
import { MongoClient } from 'mongodb';
export { ObjectId } from 'mongodb';

export const getClient = async (dbName) => {

  config()

  const mongoDbUrl = process.env.MONGODB_URL;

  if (!mongoDbUrl) {
    throw new Error('Missing MONGODB_URL env');
  }

  const client = new MongoClient(mongoDbUrl);
  return client.db(dbName);
};
