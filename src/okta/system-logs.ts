import debug from 'debug';
import { client } from './client.js';

const log = debug(import.meta.file);

export const getSystemLogs = async () => {
    const systemLogs = await client.systemLogApi.listLogEvents({
        filter: 'eventType eq "user.account.update_profile"',
        limit: 1
    });

    for await (const systemLog of systemLogs) {
        log(systemLog)
    }
};


getSystemLogs()