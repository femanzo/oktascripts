import { client } from './client';

export const userSearch = async (q: string) => {
  return client.userApi.listUsers({
    q,
  });
};
