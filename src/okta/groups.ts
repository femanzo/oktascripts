import { faker } from '@faker-js/faker';
import { client } from './client.js';

import debug from 'debug';

const log = debug(import.meta.file);

async function addFakeGroup() {
  return client.groupApi.createGroup({
    group: {
      profile: {
        name: faker.company.name(),
        description: faker.lorem.sentence(),
      },
    },
  });
}

export const getRandomGroup = async () => {
  const groups = await client.groupApi.listGroups();
  const groupsArr = [];

  for await (const group of groups) {
    groupsArr.push(group);
  }

  if (!groupsArr.length) {
    log('Could not find any groups, please add some groups and try again after adding some groups');
    return null;
  }

  const randomIndex = Math.floor(Math.random() * groupsArr.length);
  return groupsArr[randomIndex];
};

export const assignUserToRandomGroup = async (userId: string) => {
  let group = await getRandomGroup();
  let maxRetries = 5;
  while (maxRetries > 0 && !group?.id) {
    group = await getRandomGroup();
    maxRetries--;
  }

  if (group?.id) {
    log(`Adding user ${userId} to group ${group.id}`);
    return client.groupApi.assignUserToGroup({
      groupId: group.id,
      userId,
    });
  }

  throw new Error('Could not find any random groups, please try again after adding some groups');
};

export const addFakeGroups = async (amount = 1, addRandomUsers = 0) => {
  const addedEntities = [];

  for (let i = 0; i < amount; i++) {
    addedEntities.push(addFakeGroup());
  }

  return Promise.allSettled(addedEntities).catch((err) => {
    log(err);
  });
};
