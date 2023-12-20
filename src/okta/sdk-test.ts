import { client } from './client';

async function main() {
  const promises = [];
  for (let i = 0; i < 2; i++) {
    promises.push(client.listUsers({}));
  }
  const res = await Promise.all(promises);

  for (const result of res) {
    for await (const user of result) {
      // console.log(user?._embedded);
    }
  }
}
main();
