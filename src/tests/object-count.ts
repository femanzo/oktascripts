import { ObjectId } from 'mongodb';
import { getClient } from '../mongo';

async function main() {
  const client = await getClient('omt-local');

  console.time('countTime');
  const count = await client.collection('OktaUser').countDocuments({
    runId: new ObjectId('65692b0396ca1712248db98a'),
  });
  console.timeEnd('countTime');
  console.log('Total count: ', count);
}

main();
