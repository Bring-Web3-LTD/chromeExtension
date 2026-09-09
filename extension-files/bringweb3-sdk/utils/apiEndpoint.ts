export type EndpointName = string

export class ApiEndpoint {
  private static instance: ApiEndpoint | null = null;
  private readonly baseDomain: string = 'https://api.bringweb3.io';
  private readonly apiPath: string = 'v1/extension';
  private endpoint: EndpointName | '' = ''
  private whitelistEndpoint: string = '';
  private apiKey: string = '';
  // Partner proxy endpoint. When set it's the full URL every request goes to -
  // baseDomain, apiPath and the per-call path are all skipped, so our routing
  // layout isn't imposed on theirs. A dev envName still wins over it.
  private baseUrl: string = '';
  // Dev-only environment segment, read from storage at init.
  private envName: string = '';

  private constructor() {
  }

  public static getInstance(): ApiEndpoint {
    if (!ApiEndpoint.instance) {
      ApiEndpoint.instance = new ApiEndpoint();
    }
    return ApiEndpoint.instance;
  }

  public setWhitelistEndpoint(endpoint: string): void {
    this.whitelistEndpoint = endpoint;
  }

  public setApiEndpoint(endpoint: string): void {
    this.endpoint = endpoint;
  }

  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Stores the partner endpoint as given - it's the full URL we request, so a trailing
   * slash is theirs to keep. Throws on anything that isn't an https URL (http is allowed
   * for local development only).
   */
  public setBaseUrl(baseUrl: string): void {
    let url: URL;
    try {
      url = new URL(baseUrl);
    } catch {
      throw new Error('invalid baseUrl');
    }
    const isLocal = ['localhost', '127.0.0.1'].includes(url.hostname);
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocal)) {
      throw new Error('baseUrl must use https');
    }
    this.baseUrl = baseUrl;
  }

  public setEnvName(envName: string): void {
    this.envName = envName;
  }

  public getWhitelistEndpoint(): string {
    return this.whitelistEndpoint;
  }

  /**
   * Full URL for an API call.
   * - envName set (dev only): https://api.bringweb3.io/{envName}/v1/extension{path}
   * - baseUrl set: the partner endpoint itself - our path isn't appended, so their
   *   proxy keeps its own routing
   * - otherwise: https://api.bringweb3.io/v1/extension{path}
   */
  public getEndpoint(path: string): string {
    if (this.envName) return `${this.baseDomain}/${this.envName}/${this.apiPath}${path}`;
    if (this.baseUrl) return this.baseUrl;
    return `${this.baseDomain}/${this.apiPath}${path}`;
  }

  public getApiKey(): string {
    if (!this.apiKey) {
      throw new Error('API key not set. Call setApiKey first.');
    }
    return this.apiKey;
  }
}