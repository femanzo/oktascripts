import debug from 'debug';
import { client } from './client.js';

const log = debug(import.meta.file);

export const listUsers = async () => {
  const users = await client.userApi.listUsers({});

  for await (const user of users) {
    log(user?.profile?.email);
  }
};

export const removeUsers = async () => {
  const users = await client.userApi.listUsers({
    search: 'profile.email eq "A378570.C563781@gmail.com"',
  });

  for await (const user of users) {
    log(user?.profile?.email);
    if (user?.id) {
      await client.userApi.deleteUser({
        userId: user.id,
      });
    }
  }
};

export const removeAllGroups = async () => {
  const groups = await client.groupApi.listGroups({
    expand: 'users',
  });

  for await (const group of groups) {
    const _userCount = 0;
    if (group?.id) {
      await client.groupApi.listGroupUsers({
        groupId: group.id,
      });
      const appLinks = await client.groupApi.listAssignedApplicationsForGroup({
        groupId: group.id,
      });

      log(`People Count: ${JSON.stringify(group)}`);
      log(`App Count: ${appLinks.currentItems}`);
      log('---');
    }
  }
};
