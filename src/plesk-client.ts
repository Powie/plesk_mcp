import { ApiClient } from './api-client.js';
import { PleskInstance } from './types.js';

/**
 * Plesk REST API client (/api/v2)
 */
export class PleskClient extends ApiClient {
  constructor(instance: PleskInstance) {
    super(instance, '/api/v2', 'Plesk');
  }
}
