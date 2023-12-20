import type { User } from '@okta/okta-sdk-nodejs';
import type { AxiosResponse } from 'axios';
import axios, { AxiosInstance, } from 'axios';
import debug from 'debug';
import { Readable } from 'node:stream';

const oktaToken = process.env.OKTA_API_TOKEN
const baseURL = process.env.OKTA_ORG_URL

// axios.interceptors.request.use(function (config) {
//     console.log('request', config)
//     return config;
// }, function (error) {
//     console.log(error)
//     return Promise.reject(error);
// });

// axios.interceptors.response.use(function (response) {
//     console.log('response', response)
//     return response;
// }, function (error) {
//     console.log(error)
//     return Promise.reject(error);
// });

interface EndpointRateLimit {
    ongoing: number
    total?: number
    remaining?: number
    reset?: number
}

interface IOktaAPIParams {
    filter?: string,
    search?: string,
    limit?: number
}

interface IGateway {
    /**
     * Main axios instance for making requests
     */
    client: AxiosInstance

    /**
     * Rate limits for each endpoint
     */
    endpointRateLimits: Record<string, EndpointRateLimit>

    /**
     * Total ongoing requests
     */
    totalOngoingRequests: number

    /** function that will execute the request */
    makeRequest<T>(endpoint: string, params?: any): Readable

    /**
     * Parses the headers from the response
     * to update the rate limits
     */
    updateRateLimits(endpoint: string, headers: AxiosResponse['headers']): void

    /**
     * List all users based on query
     */
    listUsers(params?: Record<string, string | number>): Readable
}

const client = axios.create({
    headers: {
        "Content-Type": "application/json",
        accept: "*/*",
        Authorization: `SSWS ${oktaToken}`,
    },
    baseURL: `${baseURL}/api/v1/`
})

export class OktaGateway implements IGateway {
    client: AxiosInstance
    endpointRateLimits: Record<string, EndpointRateLimit> = {}
    log: debug.Debugger = debug(import.meta.file)
    totalOngoingRequests = 0

    constructor() {
        this.client = client
    }

    incrementOngoingRequests(endpoint: string): void {
        this.totalOngoingRequests++

        if (!this.endpointRateLimits[endpoint]) {
            this.endpointRateLimits[endpoint] = {
                ongoing: 1,
            }
            return
        }

        this.endpointRateLimits[endpoint].ongoing++
    }

    makeRequest<T>(endpoint: string, params?: IOktaAPIParams): Readable {
        const stream = new Readable({
            objectMode: true,
            read() {
            }
        });

        const fetchPage = async <T>(url: string, params?: IOktaAPIParams) => {
            this.incrementOngoingRequests(endpoint)

            console.log('request started')
            const response = await this.client.get(url, { params })
            this.updateRateLimits(endpoint, response.headers)

            try {
                const data = response.data
                const headers = response.headers

                if (data && data.length > 0) {
                    data.forEach((user: T) => {
                        stream.push(user as T)
                    })
                }

                if (headers.link) {
                    const links = this.parseLinkHeader(headers.link);
                    if (links.next) {
                        fetchPage(links.next);
                    } else {
                        console.log('request done')
                        stream.push(null);
                    }
                } else {
                    console.log('no link on headers')
                    stream.push(null);
                }
            } catch (err) {
                console.log(err)
                stream.emit('error', err);
                stream.push(null);
            }
        }

        fetchPage<T>(endpoint, params)
        return stream
    }

    parseLinkHeader(linkHeader: string) {
        const links: Record<string, string> = {}
        linkHeader.split(',').forEach(part => {
            const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/i);
            if (match) {
                links[match[2]] = match[1];
            }
        });
        return links;
    }

    listUsers(params?: IOktaAPIParams): Readable {
        const stream = this.makeRequest<User>('users', params)
        return stream
    }

    getRateLimitForEndpoint(endpoint: string): EndpointRateLimit {
        return this.endpointRateLimits[endpoint]
    }

    updateRateLimits(endpoint: string, headers: AxiosResponse['headers']): void {
        this.endpointRateLimits[endpoint].total = parseInt(headers["x-rate-limit-limit"], 10)
        this.endpointRateLimits[endpoint].remaining = parseInt(headers["x-rate-limit-remaining"], 10)
        this.endpointRateLimits[endpoint].reset = parseInt(headers["x-rate-limit-reset"], 10)
        this.endpointRateLimits[endpoint].ongoing--
        this.totalOngoingRequests--
    }
}

export const oktaGateway = new OktaGateway()