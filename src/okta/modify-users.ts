import type { User } from '@okta/okta-sdk-nodejs';
import debug from 'debug';
import { client } from './client.js';

const log = debug(import.meta.file);

export const modifyUsers = async () => {
    const users = await client.userApi.listUsers({

    });

    let totalFound = 0
    let total = 0
    for await (const user of users) {
        totalFound++

        log(user?.profile?.lastName + ' -  Total found' + totalFound);
        if (user) {
            if (!user.profile?.lastName?.startsWith('modified')) {
                try {
                    await modifyUser(user);
                    total++
                    log('total: ' + total)
                } catch (err) {
                    log(err)
                }
            }
        }
    }

    const modifiedUsers = await client.userApi.listUsers({
        q: 'profile.lastName sw modified',
    });

    let totalModified = 0
    for await (const user of modifiedUsers) {
        totalModified++
        log(user?.profile?.lastName + ' -  Total modified' + totalModified)
    }

};

export const modifyUser = async (user: User) => {
    if (user.id) {
        await client.userApi.replaceUser({
            userId: user.id,
            user: {
                ...user,
                profile: {
                    ...user.profile,
                    lastName: 'modified' + user.profile?.lastName,
                }
            },
        });
    }
    log('ok' + user.profile?.lastName)
};

export const modifyUserById = async (userId: string) => {
    const user = await client.userApi.getUser({
        userId
    });

    await client.userApi.replaceUser({
        userId,
        user: {
            ...user,
            profile: {
                ...user.profile,
                lastName: 'modified' + user.profile?.lastName,
            }
        },
    });
    log('ok' + user.profile?.lastName)
};

modifyUsers()