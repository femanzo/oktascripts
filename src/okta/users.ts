import { faker } from '@faker-js/faker';
import type { UserApiCreateUserRequest } from '@okta/okta-sdk-nodejs';
import axios from 'axios';
import debug from 'debug';
import { client } from './client';
import { getRandomGroup } from './groups';

const log = debug(import.meta.file);

const emailMaxLength = 85;

type FakeUserOptions = {
  addToRandomGroup: boolean;
  forceLongEmail: boolean;
};

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
        city,
        email,
        login: email,
      },
    },
  };

  if (options.addToRandomGroup) {
    const randomGroup = await getRandomGroup();
    if (randomGroup?.id) {
      createUserRequest.body.groupIds = [randomGroup.id];
    }
  }

  return client.userApi
    .createUser(createUserRequest)
    .then(() => {
      log('User Added');
    })
    .catch((err) => {
      log(err);
    });
};

export const addFakeUsers = async (amount = 1) => {
  const addedUsers = [];

  for (let i = 0; i < amount; i++) {
    addedUsers.push(
      addFakeUser({
        addToRandomGroup: true,
        forceLongEmail: true,
      }),
    );
  }

  return Promise.allSettled(addedUsers).catch((err) => {
    log(err);
  });
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
