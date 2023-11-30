import { MongoClient } from 'mongodb';
export { ObjectId } from 'mongodb';

const mongoDbUrl = process.env.MONGODB_URL;

export const getClient = async (dbName: string) => {
  if (!mongoDbUrl) {
    throw new Error('Missing MONGODB_URL env');
  }

  const client = new MongoClient(mongoDbUrl);

  return client.db(dbName);
};
