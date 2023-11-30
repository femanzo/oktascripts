import { client } from './client';

export const getTenantInfo = async () => {
  const apps = await client.applicationApi.listApplications();
  const tenant = await client.orgSettingApi.getWellknownOrgMetadata();

  return {
    apps,
    tenant,
  };
};
