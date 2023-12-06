import { faker } from '@faker-js/faker';
import debug from 'debug';
import { ObjectId, getClient } from './client';

const log = debug(import.meta.path.split('/').slice(-2).join('_'));

export const addFakeOktaUsersToMongo = async (samples = 1) => {
  log('Adding fake users to mongodb based on existing users');
  const db = await getClient('omt-local');
  const oktaUsers = db.collection('OktaUser');

  const sampleUsers = [];
  const addUsers = [];

  try {
    const realUsersAggregate = oktaUsers.aggregate([{ $sample: { size: samples } }], {
      allowDiskUse: true,
    });

    for await (const realUser of realUsersAggregate) {
      sampleUsers.push(realUser);
    }
    log(`Using ${sampleUsers.length} users as base`);

    for (let i = 0; i < sampleUsers.length; i++) {
      const user = sampleUsers[i];
      user.oktaId = faker.string.hexadecimal({ length: 20, prefix: '00u' });
      user.externalId = user.oktaId;
      user.runId = new ObjectId('65692b0396ca1712248db98a');
      user.object.id = user.oktaId;
      delete user._id;

      addUsers.push(user);
    }
  } catch (err) {
    log('Error before insertMany');
    throw err;
  }

  try {
    await oktaUsers.insertMany(addUsers);
  } catch (err) {
    log(err);
  }
  log('New user added');
};

export const assignUsersToBackup = async (runId: string) => {
  const db = await getClient('omt-local');
  const oktaUsers = db.collection('OktaUser');

  await oktaUsers.updateMany(
    {
      runId,
    },
    [{ $set: { runId: new ObjectId(runId), lastModified: '$$NOW' } }],
  );
};

// export const cleanUp = async () => {
//   const db = await getClient();
//   log('Cleaning....');
//   await Promise.all(['source', 'edge'].map((c) => db.collection(c).deleteMany()));
// };

// export const fillUp = async () => {
//   log('Inserting...');
//   const db = await getClient();
//   await db.collection('edge').insertMany(
//     Array(1000)
//       .fill(1)
//       .map((e, i) => ({ gid: 1 })),
//   );
//   await db.collection('source').insertOne({});
// };

// export const mongoTest = async () => {
//   await cleanUp();

//   await fillUp();

//   log('Fattening up....');
//   const db = await getClient();

//   await db.collection('edge').updateMany({}, { $set: { data: 'x'.repeat(100000) } });
//   const pipeline = [
//     {
//       $lookup: {
//         from: 'edge',
//         localField: '_id',
//         foreignField: 'gid',
//         as: 'results',
//       },
//     },
//     { $unwind: '$results' },
//     { $match: { 'results._id': { $gte: 1, $lte: 5 } } },
//     { $project: { 'results.data': 0 } },
//     { $group: { _id: '$_id', results: { $push: '$results' } } },
//   ];

//   // List and iterate each test case
//   const tests = ['Failing.. Size exceeded...', 'Working.. Applied $unwind...', 'Explain output...'];

//   for (const [idx, test] of Object.entries(tests)) {
//     log(test, idx);

//     try {
//       const currpipe = +idx === 0 ? pipeline.slice(0, 1) : pipeline,
//         options = +idx === tests.length - 1 ? { explain: true } : {};

//       await new Promise((end, error) => {
//         const cursor = db.collection('source').aggregate(currpipe, options);
//         for (const [key, value] of Object.entries({ error, end, data })) cursor.on(key, value);
//       });
//     } catch (e) {
//       error(e);
//     }
//   }
// };
