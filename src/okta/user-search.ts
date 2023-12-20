import { client } from './client';

export const userSearch = async (q: string) => {
  return client.userApi.listUsers({
    q,
  });
};

async function main() {
  const users = await userSearch(
    'timmothy.pollich@J1E2LuYIXve9pbRVPdRyyS9zDLkE9NVRYIzld3mOQH223m10YAentire-caboose.net',
  );
  for await (const user of users) {
    console.log(user.profile);
  }
}
