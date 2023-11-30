import debug from 'debug';
import { client } from './client.js';

const log = debug(import.meta.file);

export const removeTestApp = async () => {
  log('Removing test app');
  try {
    await client.applicationApi.deactivateApplication({
      appId: '0oadii3zpyPTW3VS15d7',
    });

    const res = await client.applicationApi.deleteApplication({
      appId: '0oadii3zpyPTW3VS15d7',
    });

    return res;
  } catch (err) {
    log(err);
  }
};
export const listApplications = async () => {
  log('Running listApplications');
  return client.applicationApi.listApplications();
};
