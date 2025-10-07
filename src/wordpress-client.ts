import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { PleskInstance } from './types.js';
import https from 'https';

/**
 * WordPress Toolkit API Client
 * Handles WordPress-specific operations through the WP Toolkit REST API
 */
export class WordPressClient {
  private axiosInstance: AxiosInstance;
  private instance: PleskInstance;

  constructor(instance: PleskInstance) {
    this.instance = instance;

    // Create axios instance with base configuration for WP Toolkit API
    this.axiosInstance = axios.create({
      baseURL: `${instance.url}/api/modules/wp-toolkit/v1`,
      headers: {
        'X-API-Key': instance.apiKey,
        'Content-Type': 'application/json',
      },
      // Allow self-signed certificates (for test environments)
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
  }

  /**
   * Make a GET request
   */
  async get<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.get<T>(endpoint, config);
      return response.data;
    } catch (error) {
      this.handleError(error, 'GET', endpoint);
      throw error;
    }
  }

  /**
   * Make a POST request
   */
  async post<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.post<T>(endpoint, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error, 'POST', endpoint);
      throw error;
    }
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.put<T>(endpoint, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error, 'PUT', endpoint);
      throw error;
    }
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.patch<T>(endpoint, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error, 'PATCH', endpoint);
      throw error;
    }
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.delete<T>(endpoint, config);
      return response.data;
    } catch (error) {
      this.handleError(error, 'DELETE', endpoint);
      throw error;
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any, method: string, endpoint: string): void {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      console.error(`WordPress API Error [${this.instance.name}] ${method} ${endpoint}: ${status} - ${message}`);
    } else {
      console.error(`WordPress API Error [${this.instance.name}] ${method} ${endpoint}:`, error);
    }
  }

  /**
   * Get instance name
   */
  getInstanceName(): string {
    return this.instance.name;
  }
}
