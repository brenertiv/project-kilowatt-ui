import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { tickets } from '../data';

const catalog: Record<string, unknown> = {
  '/tickets': tickets,
};

export const http = axios.create({
  baseURL: '/api',
  timeout: 8000,
  adapter: async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const path = config.url ?? '';
    const data = catalog[path];
    if (data === undefined) {
      return Promise.reject(new Error(`No lab mock for ${path}`));
    }
    return {
      data,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config,
    };
  },
});
