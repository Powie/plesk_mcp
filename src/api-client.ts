import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import https from 'https';
import { PleskInstance } from './types.js';

/**
 * HTTPS agent shared by all Plesk requests.
 * Certificate verification is off by default because Plesk often runs with a
 * self-signed certificate on port 8443; set PLESK_VERIFY_TLS=true to enable it.
 */
export function createHttpsAgent(): https.Agent {
  return new https.Agent({
    rejectUnauthorized: process.env.PLESK_VERIFY_TLS === 'true',
  });
}

/**
 * Normalize a Plesk base URL (strip trailing slashes)
 */
export function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Generic API client for a Plesk instance, authenticated with its API key
 */
export class ApiClient {
  private axiosInstance: AxiosInstance;
  private instance: PleskInstance;
  private label: string;

  constructor(instance: PleskInstance, basePath: string, label: string) {
    this.instance = instance;
    this.label = label;
    this.axiosInstance = axios.create({
      baseURL: `${normalizeUrl(instance.url)}${basePath}`,
      headers: {
        'X-API-Key': instance.apiKey,
        'Content-Type': 'application/json',
      },
      httpsAgent: createHttpsAgent(),
    });
  }

  async get<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url: endpoint });
  }

  async post<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url: endpoint, data });
  }

  async put<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url: endpoint, data });
  }

  async patch<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url: endpoint, data });
  }

  async delete<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url: endpoint });
  }

  getInstanceName(): string {
    return this.instance.name;
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.request<T>(config);
      return response.data;
    } catch (error) {
      this.logError(error, config.method!, config.url!);
      throw error;
    }
  }

  /**
   * Log API errors to stderr (stdout is reserved for the MCP protocol)
   */
  private logError(error: any, method: string, endpoint: string): void {
    const prefix = `${this.label} API Error [${this.instance.name}] ${method} ${endpoint}`;
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = (error.response?.data as any)?.message || error.message;
      console.error(`${prefix}: ${status} - ${message}`);
    } else {
      console.error(`${prefix}:`, error);
    }
  }
}
