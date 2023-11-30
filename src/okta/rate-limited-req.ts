import axios from 'axios';
import { get } from 'lodash';

const OBJECT_NOT_FOUND_ERROR_CODE = 'E0000007';
const ACCESS_DENIED_ERROR_CODE = 'E0000006';
export const IS_APP_SIGNING_KEY_ERROR = '(AppInstanceKeyMapping)';
export const IS_CLASSIC_VERSION_ERROR_CODE = 'E0000015';
export const API_PAGE_SIZE = 200;
export interface OktaApiError {
  status?: number;
  errorCode?: string;
  errorCauses?: OktaApiErrorCause[];
  message?: string;
}

export interface OktaApiErrorCause {
  errorSummary?: string;
}

export function isAppSigningKeyError(error: Error) {
  const oktaApiError = error as OktaApiError;
  return oktaApiError?.message?.includes(IS_APP_SIGNING_KEY_ERROR);
}

export function isObjectNotFoundError(error: Error) {
  const oktaApiError = error as OktaApiError;
  return oktaApiError?.errorCode === OBJECT_NOT_FOUND_ERROR_CODE;
}

export function isPermissionError(error: Error) {
  const oktaApiError = error as OktaApiError;
  return oktaApiError?.errorCode === ACCESS_DENIED_ERROR_CODE;
}

export function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isBadRequestError(error: Error) {
  const oktaApiError = error as OktaApiError;
  return oktaApiError?.status === 400;
}

export interface PaginatedOktaResponse {
  objects: unknown;
  nextUrl?: string;
}

export async function oktaRateLimitedRequest(
  url: string,
  token: string,
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'GET',
  params: { [prop: string]: string | number | boolean | undefined } = {},
  body: { [prop: string]: string | number | unknown } = {},
  paginated = false,
  maxApiUsage = 50,
  nextUrl: string | null = null,
): Promise<PaginatedOktaResponse> {
  try {
    if (nextUrl) {
      params.after = nextUrl;
      params.q = undefined;
    }
    const response = await axios({
      url,
      method,
      ...(method === 'GET' ? {} : { data: JSON.stringify(body) }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `SSWS ${token}`,
      },
      params, 
    });
    const rateLimitRemaining = Number(get(response.headers, 'x-rate-limit-remaining', '100'));
    const apiRateLimit = Number(get(response.headers, 'x-rate-limit-limit', '100'));
    const rateLimitPercentage = (apiRateLimit / 100) * maxApiUsage;
    if (apiRateLimit - rateLimitRemaining > rateLimitPercentage) {
      await timeout(60000);
    }
    if (paginated) {
      const links = get(response.headers, 'link', '').split(',');
      const cursor =
        links?.length > 1 && (response.data.length || Object.keys(response.data).length)
          ? links[1].split(';')[0].replace(/[\<\s\>]/g, '')
          : null;
      return {
        objects: response.data,
        nextUrl: cursor,
      };
    }
    return {
      objects: response.data,
    };
  } catch (error) {
    if ('response' in error && error.response?.status === 429) {
      await timeout(60000);
      return oktaRateLimitedRequest(url, token, method, params, body, paginated, maxApiUsage, nextUrl);
    }
    console.log(error);
    throw error;
  }
}
