import http from 'http'
// import fetch from 'node-fetch'
import axios from 'axios'
import { exec } from 'child_process'


const totalRequests = 2;
const testUrl = `http://192.168.88.139:3001/api/v1/health/hello`;

let success = 0
let fail = 0
const ephemeralStart = 49152;
const ephemeralEnd = 65535;
const totalEphemeralPorts = ephemeralEnd - ephemeralStart + 1;

const agent = new http.Agent({
  keepAlive: true,
  maxSockets: Infinity,
  noDelay: false,
  maxFreeSockets: 1,
});

const fetchTest = (url, agent, id) => {
  return fetch(url, { agent })
    .then(response => {

      if (!response.ok) {
        throw new Error(`Request ${id} failed with status ${response.status}`);
      }
      return response.text();
    })
    .then(succeed)
    .catch(failed);
};

const axiosTest = (url, agent, id) => {
  return axios(url, {
    method: 'GET',
    agent
  })
    .then(response => {
      console.log(response.request)

      if (response.status !== 200) {
        console.log(response.headers)
        throw new Error(`Request ${id} failed with status ${response.status}`);
      }

      return response.data
    })
    .then(succeed)
    .catch(failed);
};

const succeed = (res) => {
  success++;
  if (success % 500 === 0) {
    console.log(`Success: ${success}, Fail: ${fail}`);
    checkAvailablePorts()
  }

  // console.log(`Success: ${success}, Fail: ${fail}, ${res}`);
  if (success + fail >= totalRequests) {
    console.log(`Success: ${success}, Fail: ${fail}`);
    console.timeEnd('test');
  }
}

const failed = (err) => {
  fail++;
  if (fail % 500 === 0) {
    console.log(`Success: ${success}, Fail: ${fail}`);
    checkAvailablePorts()
  }

  if (success + fail >= totalRequests) {
    console.log(`Success: ${success}, Fail: ${fail}`);
    console.timeEnd('test');
  }
}

const startTest = (url, agent, totalRequests) => {
  console.log(`Starting test with ${totalRequests} simultaneous connections...`);

  console.time('test');
  for (let i = 0; i < totalRequests; i++) {
    // fetchTest(url, agent, i + 1);
    axiosTest(url, agent, i + 1)
  }
};


startTest(testUrl, agent, totalRequests);

function checkAvailablePorts() {


}

