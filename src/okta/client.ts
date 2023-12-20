import { Client, DefaultRequestExecutor } from '@okta/okta-sdk-nodejs';
import { RequestOptions } from '@okta/okta-sdk-nodejs/src/types/request-options';
import debug from 'debug';

const log = debug(import.meta.file);

debug.enable('*');


class ExtendedDefaultRequestExecutor extends DefaultRequestExecutor {
  constructor(options) {
    super(options);
    this.on('response', res => {
      log('remaining: ' + res.headers.get('x-rate-limit-remaining'));
    })
  }

  fetch(request) {
    log(request.url)
    request.response = null
    return super.fetch(request)
  }

  parseResponse(request: RequestOptions, response: Response) {
    return super.parseResponse(request, response)
  }
}

const requestExecutor = new ExtendedDefaultRequestExecutor({
  maxRetries: 1,
  requestTimeout: 0,
});

// requestExecutor.on('resume', (request) => {
//   log('req', request);
// });

// requestExecutor.on('request', (request) => {
//   log('req', request);
// });

// requestExecutor.on('backoff', (data) => {
//   log('backoff', data);
// });

// requestExecutor.on('resume', (data) => {
//   log('resume', data);
// });

// requestExecutor.on('response', (res) => {
//   log('res', res);
// });

// requestExecutor.on('res', (res) => {
//   log('res', res);
// });

requestExecutor.setMaxListeners(100);

export const client = new Client({
  orgUrl: process.env.OKTA_ORG_URL,
  token: process.env.OKTA_API_TOKEN,
  requestExecutor,
});
