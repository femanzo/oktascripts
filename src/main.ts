import { input, rawlist } from '@inquirer/prompts';
import debug from 'debug';
import { addFakeOktaSystemLogs, addFakeOktaUsersToMongo, assignUsersToLatestBackup } from './mongo';

import {
  addFakeGroups,
  addFakeUsers,
  axiosGetUsers,
  client,
  getTenantInfo,
  listApplications,
  removeTestApp,
  sdkGetUsers,
} from './okta';
enum Actions {
  AddUsersToOkta = 0,
  AddGroups = 1,
  ListUsers = 2,
  ListApps = 3,
  DisplayTenantInfo = 4,
  RemoveTestApp = 5,
  AddUsersMongo = 6,
  AssignUsersToBackup = 7,
  AddOktaSystemLogEvent = 8
}


const log = debug('main');
debug.enable('main:*');

const actions = [
  { name: 'Tenant info', value: Actions.DisplayTenantInfo },
  { name: 'Add Fake Users', value: Actions.AddUsersToOkta },
  { name: 'Add Fake Groups', value: Actions.AddGroups },
  { name: 'List Users', value: Actions.ListUsers },
  { name: 'List Apps', value: Actions.ListApps },
  { name: 'Remove Test App', value: Actions.RemoveTestApp },
  { name: 'Add Fake Users to MongoDB', value: Actions.AddUsersMongo },
  { name: 'Add Fake OktaSystemLog MongoDB', value: Actions.AddOktaSystemLogEvent },
  { name: 'Assign Users to Backup', value: Actions.AssignUsersToBackup },
  { name: 'Exit', value: 0 },
];

async function main() {
  log(`Connected to Okta -> ${client.baseUrl}`);

  const commandInput = await rawlist({
    message: 'What would you like to do?',
    choices: Object.values(actions),
  });

  log('Input', commandInput);
  if (commandInput === Actions.AddGroups || commandInput === Actions.AddUsersToOkta) {
    const countInput = await input({
      message: 'How many?',
    });

    if (!countInput || Number.isNaN(Number(countInput))) {
      log('None added. Exiting...');
    }

    if (commandInput === Actions.AddUsersToOkta) {
      await addFakeUsers(Number(countInput));
    }

    if (commandInput === Actions.AddGroups) {
      await addFakeGroups(Number(countInput));
    }

  }

  if (commandInput === Actions.ListUsers) {
    const axiosUsers = await axiosGetUsers();
    const sdkUsers = await sdkGetUsers();

    log('------');
    for (const user of axiosUsers) {
      log('axios\n----', user.profile.email);
    }
    log('------');
    for await (const user of sdkUsers) {
      log('sdk\n----', user?.profile?.email);
    }
  }

  if (commandInput === Actions.RemoveTestApp) {
    const res = await removeTestApp();
    log(res);
  }

  if (commandInput === Actions.ListApps) {
    const appList = await listApplications();
    for await (const app of appList) {
      log('apps\n----', app?.label, app?.signOnMode);
    }
  }

  if (commandInput === Actions.DisplayTenantInfo) {
    const tenantInfo = await getTenantInfo();
    log('tenant', tenantInfo);
  }

  if (commandInput === Actions.AddUsersMongo) {
    await addFakeOktaUsersToMongo(1000000);
  }

  if (commandInput === Actions.AddOktaSystemLogEvent) {
    const countInput = await input({
      message: 'How many?',
    });

    await addFakeOktaSystemLogs(Number(countInput));
  }


  if (commandInput === Actions.AssignUsersToBackup) {
    await assignUsersToLatestBackup();
  }

  log('done');
  main()
  // process.exit(0);
}

main();
