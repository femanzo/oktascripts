import debug from 'debug';
import { ObjectId } from 'mongodb';
import { Transform, pipeline } from 'stream';
import { getClient } from '../mongo';
import { oktaGateway } from '../okta/http-client';

const log = debug(import.meta.file);

debug.enable(import.meta.file);

// Max size for the id search in a single okta request  
const MAX_OKTA_SEARCH_SIZE = 15
const MAX_CONCURRENT_REQUESTS = 5

async function main() {
    const db = await getClient('omt-local');
    const oktaUsers = db.collection('OktaUser');
    const query = { runId: new ObjectId("657d05bc9d3b8bf81197b451") }
    const totalUsersCount = await oktaUsers.countDocuments(query)

    const oktaUsersCursor = oktaUsers.find(query, {
        noCursorTimeout: true,
        projection: {
            oktaId: 1
        }
    }).batchSize(2000)

    let oktaIds: string[] = []
    let processedUsers = 0

    const oktaUsersStream = oktaUsersCursor.stream()

    oktaUsersStream.on('pause', () => {
        log(`oktaUserStream paused with ${oktaUsersCursor.bufferedCount()} items in buffer`)
    })

    oktaUsersStream.on('resume', () => {
        log(`oktaUserStream resumed with ${oktaUsersCursor.bufferedCount()} items in buffer`)
    })

    pipeline(
        oktaUsersStream,
        /**
         * Get users IDs from mongo
         */
        new Transform({
            objectMode: true,
            transform(doc, encoding, callback) {
                oktaIds.push(doc.oktaId)
                if (oktaIds.length >= MAX_OKTA_SEARCH_SIZE) {
                    this.push(oktaIds);
                    oktaIds = [];
                }
                callback();
            },
            flush(callback) {
                if (oktaIds.length > 0) {
                    this.push(oktaIds);
                }
                callback();
            }
        }),
        new Transform({
            objectMode: true,
            transform(idsBatch, encoding, callback) {
                log('Ongoing Endpoint Request Rate limiter ...')
                const checkRateLimit = () => {
                    // const endpointRateLimit = oktaGateway.getRateLimitForEndpoint('users')
                    if (oktaGateway.totalOngoingRequests > MAX_CONCURRENT_REQUESTS) {
                        log('Rate limit reached, waiting...')
                        setTimeout(checkRateLimit, 1000)
                    } else {
                        this.push(idsBatch)
                        callback();
                    }
                }
                checkRateLimit()
            },
        }),
        /**
         * Receive user IDs from mongo and batch them to okta requests
         */
        new Transform({
            objectMode: true,
            transform(batchIds, encoding, callback) {
                log(`Requesting ${batchIds.length} users from Okta`)

                const users = oktaGateway.listUsers({
                    search: getOktaUsersQuery(batchIds)
                })

                const allUsersProcessed = new Promise((resolve, reject) => {
                    users.on('data', user => {
                        this.push(user);
                        console.log('user', user.profile.email);
                    });

                    users.on('end', () => {
                        resolve();
                    });

                    users.on('error', (err) => {
                        reject(err);
                    });
                });

                allUsersProcessed.then(() => {
                    callback();
                }).catch(err => {
                    callback(err);
                });

                callback();
            },
            flush(callback) {
                log('flushing')
                callback();
            }
        }),
        new Transform({
            objectMode: true,
            transform(user, encoding, callback) {
                processedUsers++
                console.log(processedUsers + ' / ' + totalUsersCount + ' ongoingReqs:' + oktaGateway.totalOngoingRequests)
                callback();
            },
        }),
        (err) => {
            if (err) {
                console.error('Pipeline failed.', err);
            } else {
                console.log('Pipeline succeeded.');
            }
        }
    );
}

function getOktaUsersQuery(oktaIds: string[]) {
    return oktaIds.map(id => `id eq "${id}"`).join(' or ')
}

main()