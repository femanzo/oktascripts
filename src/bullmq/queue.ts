import { ConnectionOptions, Job, MetricsTime, Queue, QueueEvents, Worker } from 'bullmq';

const connection: ConnectionOptions = {
    host: '192.168.88.142',
    port: 6379,
    password: 'eYVX7EwVmmxKPCDmwMtyKVge8oLd2t81',
};

export function workerFactory<T, R>({
    queueName,
    maxConcurrency = 50
}: {
    queueName: string,
    maxConcurrency?: number
}, workerFunction: (job: Job<T, R>) => Promise<R>) {
    return {
        worker: new Worker<T, R>(queueName, workerFunction, {
            connection,
            concurrency: maxConcurrency,
            metrics: {
                maxDataPoints: MetricsTime.ONE_HOUR
            }
        }),
        queue: new Queue(queueName, {
            connection,
        }),
        queueEvents: new QueueEvents(queueName, { connection }),
    }
}


export function queueFactory(queueName: string) {
    return new Queue(queueName, { connection });
}

// // Queue
// const stringModificationQueue = new Queue('stringModificationQueue', { connection });

// // Worker
// const appendJosiasWorker = new Worker('stringModificationQueue', async (job: Job) => {
//     const originalString = job.data;
//     await new Promise(resolve => setTimeout(resolve, 1000));
//     const modifiedString = originalString + " - josias";
//     return modifiedString;
// }, {
//     connection,
//     concurrency: 50,
//     limiter: {
//         max: 1000,
//         duration: 10000
//     },
// })

// appendJosiasWorker.on('drained', () => {
//     console.log('drained')
// })

// appendJosiasWorker.on('completed', (job: Job) => {
//     console.log('completed', job.returnvalue)
// })

// async function addJobToQueue() {
//     for (let i = 0; i < 100; i++) {
//         await stringModificationQueue.add('appendJosias', 'hello' + i);
//     }

//     console.log('all added')
// }

// addJobToQueue();

const gracefulShutdown = async (signal: string) => {
    console.log(`Received ${signal}, closing server...`);
    // Other asynchronous closings
    process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
