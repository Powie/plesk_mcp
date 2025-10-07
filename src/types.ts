/**
 * Plesk Instance Configuration
 */
export interface PleskInstance {
  name: string;
  url: string;
  apiKey: string;
}

/**
 * Plesk API Client Response
 */
export interface PleskApiResponse<T = any> {
  data: T;
  status: number;
}

/**
 * Domain Information
 */
export interface PleskDomain {
  id: number;
  name: string;
  guid: string;
  created: string;
  status: string;
  hosting_type: string;
  ipAddressId?: number;
  clientId?: number;
}

/**
 * Client Information
 */
export interface PleskClient {
  id: number;
  type: string;
  guid: string;
  company?: string;
  name: string;
  login: string;
  status: string;
  email: string;
  locale: string;
  owner_login?: string;
}

/**
 * Server Information
 */
export interface PleskServerInfo {
  platform: string;
  version: string;
  release_date: string;
  hostname: string;
  guid: string;
}

/**
 * IP Address Information
 */
export interface PleskIpAddress {
  ip: string;
  type: string;
  netmask?: string;
  interface?: string;
}

/**
 * Extension Information
 */
export interface PleskExtension {
  id: string;
  name: string;
  vendor: string;
  version: string;
  release: string;
  enabled: boolean;
}

/**
 * MCP Tool Arguments
 */
export interface ListDomainsArgs {
  instance?: string;
}

export interface GetDomainArgs {
  instance?: string;
  domain_id: number;
}

export interface CreateDomainArgs {
  instance?: string;
  name: string;
  ip_address_id?: number;
  hosting_type?: string;
}

export interface UpdateDomainArgs {
  instance?: string;
  domain_id: number;
  name?: string;
  status?: string;
}

export interface DeleteDomainArgs {
  instance?: string;
  domain_id: number;
}

export interface ListClientsArgs {
  instance?: string;
}

export interface GetClientArgs {
  instance?: string;
  client_id: number;
}

export interface CreateClientArgs {
  instance?: string;
  type: string;
  name: string;
  email: string;
  login: string;
  password: string;
  company?: string;
}

export interface UpdateClientArgs {
  instance?: string;
  client_id: number;
  name?: string;
  email?: string;
  company?: string;
}

export interface ClientActionArgs {
  instance?: string;
  client_id: number;
}

export interface GetServerInfoArgs {
  instance?: string;
}

export interface ListIpsArgs {
  instance?: string;
}

export interface ListExtensionsArgs {
  instance?: string;
}

export interface ExecuteCliArgs {
  instance?: string;
  command: string;
  params?: string[];
}

/**
 * WordPress Toolkit Types
 */

/**
 * WordPress Installation Information
 */
export interface WordPressInstallation {
  id: number;
  title: string;
  url: string;
  path: string;
  version: string;
  status: string;
  isMultisite: boolean;
  isMaintenance: boolean;
  isSecured: boolean;
}

/**
 * WordPress Plugin Information
 */
export interface WordPressPlugin {
  name: string;
  version: string;
  status: string;
  updateAvailable: boolean;
}

/**
 * WordPress Theme Information
 */
export interface WordPressTheme {
  name: string;
  version: string;
  status: string;
  updateAvailable: boolean;
}

/**
 * WordPress User Information
 */
export interface WordPressUser {
  id: number;
  login: string;
  email: string;
  role: string;
}

/**
 * WordPress Backup Information
 */
export interface WordPressBackup {
  id: string;
  created: string;
  size: number;
  type: string;
}

/**
 * Background Task Information
 */
export interface BackgroundTask {
  taskId: string;
  taskCode: string;
  status: string;
  progress: number;
  result?: any;
}

/**
 * WordPress MCP Tool Arguments
 */

export interface WPListInstallationsArgs {
  instance?: string;
  filter?: string;
  sort?: string;
}

export interface WPGetInstallationArgs {
  instance?: string;
  installation_id: number;
}

export interface WPCloneInstallationArgs {
  instance?: string;
  installation_id: number;
  target_domain?: string;
  target_path?: string;
}

export interface WPCreateBackupArgs {
  instance?: string;
  installation_id: number;
  description?: string;
}

export interface WPRestoreBackupArgs {
  instance?: string;
  installation_id: number;
  backup_id: string;
}

export interface WPListBackupsArgs {
  instance?: string;
  installation_id: number;
}

export interface WPToggleMaintenanceArgs {
  instance?: string;
  installation_id: number;
  enabled: boolean;
}

export interface WPClearCacheArgs {
  instance?: string;
  installation_ids: number[];
}

export interface WPGetBackgroundTaskArgs {
  instance?: string;
  task_code: string;
  task_id: string;
}

export interface WPListBackgroundTasksArgs {
  instance?: string;
  installation_id: number;
}

export interface WPUpdateVulnerabilityFilteringArgs {
  instance?: string;
  installation_id: number;
  filtering_enabled: boolean;
}
