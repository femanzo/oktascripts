import debug from 'debug';

debug.enable('*');

const totalRequests = 100;
const rateLimit = 55; // per second
const requestTime = 15; // ms

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class Client {
  name: string;
  remaining: number;
  timer: NodeJS.Timeout;
  reqId: number;
  requests: Req[];
  log: debug.Debugger;

  constructor(name: string) {
    this.name = name;
    this.remaining = rateLimit;
    this.reqId = 0;
    this.requests = [];
    this.timer = setInterval(() => {
      this.remaining = rateLimit;
    }, 1000);
    this.log = debug(this.name);
    this.log(`Starting ${this.name}`);
  }
}

class Req {
  reqId: number;
  retries = 0;
  client: Client;
  done = false;
  log: debug.Debugger;

  constructor(client: Client) {
    this.client = client;
    this.reqId = client.reqId++;
    this.log = debug(`${client.name}-${client.reqId}`);
  }

  async exec() {
    this.client.remaining--;
    if (this.client.remaining <= 0) {
      await sleep(10);
      this.retries++;
      await this.exec();
      return;
    }

    await sleep(requestTime);
    // this.log(`Req ${this.reqId} done`, this.retries);
    this.done = true;
  }
}

const sequentialCalls = async () => {
  const client = new Client('sequential');
  for (let i = 0; i < totalRequests; i++) {
    const req = new Req(client);
    await req.exec();
    client.requests.push(req);
  }

  clearInterval(client.timer);
  client.log('Done with sequential calls');
};

const parallelCalls = async () => {
  const client = new Client('parallel');
  const reqPromises = [];
  for (let i = 0; i < totalRequests; i++) {
    const req = new Req(client);
    reqPromises.push(req.exec());
    client.requests.push(req);
  }

  await Promise.all(reqPromises);

  clearInterval(client.timer);
  client.log('Done parallel calls');
};

function main() {
  sequentialCalls();
  parallelCalls();
}

main();
