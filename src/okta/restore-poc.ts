import { type User } from '@okta/okta-sdk-nodejs';
import debug from 'debug';
import { ObjectId } from 'mongodb';
import { workerFactory } from '../bullmq/queue';
import { getClient } from '../mongo';

const mainLog = debug('rst:main');
const mongoStreamLog = debug('rst:mongo-stream');

const db = await getClient('omt-local');
const oktaUsers = db.collection('OktaUser');
debug.enable('rst:*');

const MAX_ACTIVE_JOBS = 50
// Total queue size will always be between 
// MAX_QUEUED_JOBS <-> (MAX_QUEUED_JOBS + MAX_ACTIVE_JOBS)
// it's a good a idea to keep them about the same number
const MAX_QUEUED_JOBS = 50
const MONGO_CURSOR_BATCH_SIZE = 200

// Worker factory creates a worker and a queue with the same name
const { worker, queue } = workerFactory<string, User>({
    queueName: 'getOktaUserWithGroupsFromOktaId',
    maxConcurrency: MAX_ACTIVE_JOBS
}, async (job) => {
    // Simulate a 5 seconds processing time
    const ms = Math.random() * 5000
    await new Promise((resolve) => setTimeout(resolve, ms))
    if (ms > 4900) { throw new Error('This job failed') }
    return { ms } as User
})

async function main() {
    const query = { runId: new ObjectId("65540c58c5afdbc12c4336e3") }
    const totalUsersCount = await oktaUsers.countDocuments(query)
    let queueSize = 0

    /**
     * For demonstration only, cleans all queues
     */
    await queue.clean(0, 9999999, 'completed')
    await queue.clean(0, 9999999, 'wait')
    await queue.clean(0, 9999999, 'active')
    await queue.clean(0, 9999999, 'failed')

    mainLog('Total okta users: ' + totalUsersCount)

    const oktaUsersStream = oktaUsers.find(query, {
        noCursorTimeout: true,
        projection: { oktaId: 1 },
        batchSize: MONGO_CURSOR_BATCH_SIZE
    }).stream()

    worker
        .on('active', async (job) => {
            // Once job starts, we decrease the queueSize
            // and decide to resume the stream or not
            queueSize--
            if (!oktaUsersStream.closed && oktaUsersStream.isPaused() && queueSize < MAX_QUEUED_JOBS) {
                oktaUsersStream.resume()
            }
        })

    oktaUsersStream
        .on('data', async (oktaUser) => {
            await queue.add(oktaUser.oktaId, oktaUser.oktaId, {
                attempts: 5,
                backoff: { type: 'exponential', delay: 1000, },
            });
            // locally control the queue size because
            // queue.waitingCount() is needs to call redis
            queueSize++
            mongoStreamLog('loaded doc from mongo, queueSize:' + queueSize);

            // Pause the stream if total > MAX_QUEUED_JOBS
            if (!oktaUsersStream.isPaused() && queueSize >= MAX_QUEUED_JOBS) {
                oktaUsersStream.pause();
            }
        })
        .on('pause', () => {
            mongoStreamLog('oktaUsersStream paused')
        })
        .on('resume', () => {
            mongoStreamLog('oktaUsersStream resumed')
        })
        .on('end', () => {
            mongoStreamLog('oktaUsersStream stream ended')
        })
}
main()