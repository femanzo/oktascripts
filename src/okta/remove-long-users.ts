import debug from 'debug';
import { client as oktaClient } from './client';
import { oktaGateway } from './http-client';

const log = debug(import.meta.file);

debug.enable(import.meta.file);

// Max size for the id search in a single okta request  
const MAX_OKTA_SEARCH_SIZE = 15
const MAX_CONCURRENT_REQUESTS = 5

async function main() {
    log('main')
    const users = oktaGateway.listUsers({
        filter: 'status eq "STAGED"',
        limit: 1
    })


    for await (const user of users) {
        log('deleting user ' + user.profile.email)

        try {
            log(user.profile?.email?.length)
            if (user.profile?.email?.length > 70) {
                await oktaClient.userApi.deactivateUser({
                    userId: user.id,
                    sendEmail: false
                })
                const deleteUser = await oktaClient.userApi.deleteUser({
                    userId: user.id,
                    sendEmail: false,
                })
                log(deleteUser)
            }
        } catch (err) {
            log(err)
        }
    }

}

main()