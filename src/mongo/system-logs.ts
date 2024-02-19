import { randomUUID } from 'crypto';
import debug from 'debug';
import { getClient } from './client';
const log = debug('main:system-logs');

debug.enable('main:*');

export const addFakeOktaSystemLogs = async (samples = 1) => {
    log('Adding fake users to mongodb based on existing users');
    const db = await getClient('omt-local');
    const oktaSystemLogEvent = db.collection('OktaSystemLogEvent');

    // Fetch existing log documents
    const existingLogs = await oktaSystemLogEvent.find({}).toArray();

    log('Total: ' + existingLogs.length)
    // Prepare an array to hold all the duplicated logs
    const duplicatedLogs: any[] = [];

    existingLogs.forEach(item => {
        for (let i = 0; i < samples; i++) {
            // Create a deep copy and modify necessary fields
            const duplicatedLog = structuredClone(item);
            delete duplicatedLog._id;
            duplicatedLog.externalId = randomUUID();
            duplicatedLogs.push(duplicatedLog);
        }
    });

    log('DuplicatedLogs: ' + duplicatedLogs.length)


    if (duplicatedLogs.length > 0) {
        await oktaSystemLogEvent.insertMany(duplicatedLogs);
        console.log(`${duplicatedLogs.length} fake logs added.`);
    } else {
        console.log('No logs to duplicate.');
    }
};
