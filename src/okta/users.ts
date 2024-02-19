import { faker } from '@faker-js/faker';
import type { UserApiCreateUserRequest } from '@okta/okta-sdk-nodejs';
import axios from 'axios';
import debug from 'debug';
import { workerFactory } from '../bullmq/queue';
import { client } from './client';
import { getRandomGroup } from './groups';

const log = debug(import.meta.file);
debug.enable(import.meta.file)

const MAX_ACTIVE_JOBS = 100
const emailMaxLength = 25;

type FakeUserOptions = {
  addToRandomGroup: boolean;
  forceLongEmail: boolean;
};

// Worker factory creates a worker and a queue with the same name
const { worker, queue } = workerFactory<UserApiCreateUserRequest, void>({
  queueName: 'add-users-to-okta',
  maxConcurrency: MAX_ACTIVE_JOBS
}, async (job) => {
  await client.userApi.createUser(job.data)
})

export const addFakeUser = async (options: FakeUserOptions) => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const provider = faker.internet.domainName();

  let email = faker.internet
    .email({
      firstName,
      lastName,
      provider,
    })
    .toLowerCase();

  if (options.forceLongEmail) {
    email = email.replace(provider, `${faker.string.alphanumeric(emailMaxLength - email.length)}${provider}`);
  }

  log(email, email.length);

  const city = faker.location.city();
  const createUserRequest: UserApiCreateUserRequest = {
    body: {
      profile: {
        firstName,
        lastName,
        email,
        login: email,
        city,
      }
    }
  }


  if (options.addToRandomGroup) {
    const randomGroup = await getRandomGroup();
    if (randomGroup?.id) {
      createUserRequest.body.groupIds = [randomGroup.id];
    }
  }

  await queue.add('add-user-' + email, createUserRequest, {
    attempts: 3,
    backoff: { type: 'fixed', delay: 60000, },
  })
};

export const addFakeUsers = async (amount = 1) => {

  await queue.clean(0, 9999999, 'completed')
  await queue.clean(0, 9999999, 'wait')
  await queue.clean(0, 9999999, 'active')
  await queue.clean(0, 9999999, 'failed')


  for (let i = 0; i < amount; i++) {
    log('Added user', i + 1);

    await addFakeUser({
      addToRandomGroup: false,
      forceLongEmail: false,
    })
  }
};

export const countUsers = async () => {
  const groups = await client.groupApi.listGroups({
    expand: 'stats',
  });

  for await (const group of groups) {
    log(group?.profile?.name, group?._embedded?.stats.usersCount);
  }
};

export const sdkGetUsers = async () => {
  return client.userApi.listUsers({
    limit: 5,
    search: 'profile.login eq "bert1@4BVRhN5vU90uHrREwh5GwmmUynXvxf1HzwheZsvka9h1wcBupqMR1lrfflickering-hype.net"',
  });
};

export const axiosGetUsers = async () => {
  const search = encodeURI(
    'profile.login eq "bert1@4BVRhN5vU90uHrREwh5GwmmUynXvxf1HzwheZsvka9h1wcBupqMR1lrfflickering-hype.net"',
  );

  const url = `${client.baseUrl}/api/v1/users?search=${search}&limit=5`;
  const { data } = await axios.get(url, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `SSWS ${client.apiToken}`,
    },
  });

  return data;
};
