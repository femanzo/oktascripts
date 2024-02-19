import debug from 'debug';
import { getClient } from '../mongo';

const mainLog = debug('rst:main');
const mongoStreamLog = debug('rst:mongo-stream');

const db = await getClient('omt-local');
const oktaUsers = db.collection('OktaUser');
debug.enable('rst:*');

const MAX_CONCURRENT_PROCESSES = 10
const MONGO_CURSOR_BATCH_SIZE = 500

async function main() {
    // const query = { runId: new ObjectId("65540c58c5afdbc12c4336e3") }
    // const totalUsersCount = await oktaUsers.countDocuments(query)
    // let concurrentJobs = 0

    // mainLog('Total okta users: ' + totalUsersCount)

    // const oktaUsersStream = oktaUsers.find(query, {
    //     noCursorTimeout: true,
    //     projection: { oktaId: 1 },
    //     batchSize: MONGO_CURSOR_BATCH_SIZE
    // }).stream()

    // oktaUsersStream
    //     .on('data', async (oktaUser) => {
    //         concurrentJobs++
    //         mongoStreamLog('loaded doc from mongo, concurrentJobs:' + concurrentJobs);

    //         if (!oktaUsersStream.isPaused() && concurrentJobs >= MAX_CONCURRENT_PROCESSES) {
    //             oktaUsersStream.pause();
    //         }
    //     })

    const promises = [new Promise((resolve, reject) => {
        setTimeout(() => {
            reject('foo');
        }, 200);
    }
    ), new Promise((resolve, reject) => {
        setTimeout(() => {
            reject('foo2');
        }, 300);
    }
    ), new Promise((resolve, reject) => {
        setTimeout(() => {
            reject('foo3');
        }, 400);
    }
    )]

    const results = await Promise.race(promises).catch(e => console.log('e', e))

    for (const promise of promises) {
        promise.then((result) => {
            console.log(result);
        })
    }


}


main()