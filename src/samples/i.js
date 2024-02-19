import fs from 'fs'
import path from 'path'
import { getClient } from '../mongo/client.js'
import { Transform, Readable, pipeline } from 'stream'
import { ObjectId } from 'mongodb'

function processStreams(streams) {
    let currentStreamIndex = 0;

    const processNextStream = () => {
        if (currentStreamIndex < streams.length) {
            const currentStream = streams[currentStreamIndex];
            currentStreamIndex++;

            currentStream.on('data', (chunk) => {
                // Stringify and output the chunk
                console.log(JSON.stringify(chunk) + '\n');
            });

            currentStream.on('end', processNextStream);
            currentStream.on('error', (err) => {
                console.error('Stream error:', err);
                processNextStream();
            });
        }
    };

    processNextStream();

}

const modified2 = ['00ud49qs3lf0n5HLg5d7']
const modified1 = ['00u9oosjdiSsv2kLZ5d7']

getClient('omt-local').then(client => {

    const oktaUsers = client.collection('OktaUser');
    const stream1 = oktaUsers.aggregate([
        {
            $match: { oktaId: { $in: modified1 }, runId: new ObjectId('659c44f92eb4852b2b03629a') }
        }
    ]).stream()

    const stream2 = oktaUsers.aggregate([
        {
            $match: { oktaId: { $in: modified2 }, runId: new ObjectId('659c44f92eb4852b2b03629a') }
        }
    ]).stream()

    processStreams([stream1, stream2]);
}) 