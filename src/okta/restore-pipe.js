import fs from 'fs';
import { Transform, pipeline } from 'stream';
import { getClient } from '../mongo/client.js';

function makeRequestBasedOnChunk(chunk) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(chunk + '-\n');
        }, 1000);
    });
}



function logMemory() {
    const formatMemoryUsage = (data) => `${(data / 1024)} KB`;

    const memoryData = process.memoryUsage();

    const memoryUsage = {
        rss: `${formatMemoryUsage(memoryData.rss)} -> Resident Set Size - total memory allocated for the process execution`,
        heapTotal: `${formatMemoryUsage(memoryData.heapTotal)} -> total size of the allocated heap`,
        heapUsed: `${formatMemoryUsage(memoryData.heapUsed)} -> actual memory used during the execution`,
        external: `${formatMemoryUsage(memoryData.external)} -> V8 external memory`,
    };

    console.log(memoryUsage);

}
// setInterval(() => {
//     console.log('Buffered fileStream:\n')
//     console.log(fileStream._readableState.buffer.tail)
// }, 1000)


async function main() {
    const client = await getClient('omt-local');
    const oktaUsers = client.collection('OktaUser');

    // const fileStream = fs.createReadStream('sample.txt', {
    //     highWaterMark: 1,
    //     encoding: 'utf-8',
    // }); 

    const findStream = oktaUsers.find({
        runId: '65540c58c5afdbc12c4336e3'
    }, {
        noCursorTimeout: true,
        projection: {
            'object.profile.login': 1
        }
    }).stream()

    // console.log(findStream)

    pipeline(
        findStream,
        new Transform({
            objectMode: true,
            highWaterMark: 1,
            transform(chunk, encoding, callback) {
                console.log(this.readableHighWaterMark, this.writableHighWaterMark)
                setTimeout(() => {
                    makeRequestBasedOnChunk(chunk.object.profile.login).then((result) => {
                        this.push(result);
                    })
                }, 10)
                callback()
            }
        }),
        process.stdout,
        (err) => {
            if (err) {
                console.error('Pipeline failed.', err);
            } else {
                console.log('Pipeline succeeded.');
            }
        }
    )
}
main() 
