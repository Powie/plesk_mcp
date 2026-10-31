import { ApiClient } from './api-client.js';
import { PleskInstance } from './types.js';

/**
 * WP Toolkit REST API client (/api/modules/wp-toolkit/v1)
 */
export class WordPressClient extends ApiClient {
  constructor(instance: PleskInstance) {
    super(instance, '/api/modules/wp-toolkit/v1', 'WordPress');
  }
}
