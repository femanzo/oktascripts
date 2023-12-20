import { ObjectId } from 'mongodb';
import { getClient } from '../mongo';

async function main() {
  const transform1 = new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk);
    },
  });
  const transform2 = new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk);
    },
  });

  const reader = transform1.readable.pipeThrough(transform2).getReader();

  const client = await getClient('omt-local');

  console.time('countTime');
  const count = await client.collection('OktaUser').countDocuments({
    runId: new ObjectId('65692b0396ca1712248db98a'),
  });
  console.timeEnd('countTime');
  console.log('Total count: ', count);
}

main();
