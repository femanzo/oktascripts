import { Client, DefaultRequestExecutor } from '@okta/okta-sdk-nodejs';
import debug from 'debug';

const log = debug(import.meta.file);

const requestExecutor = new DefaultRequestExecutor({
  maxRetries: 10,
  requestTimeout: 0,
});

requestExecutor.setMaxListeners(100);

requestExecutor.on('data', (data) => {
  log(data);
});

export const client = new Client({
  orgUrl: process.env.OKTA_ORG_URL,
  token: process.env.OKTA_API_TOKEN,
  requestExecutor,
});
