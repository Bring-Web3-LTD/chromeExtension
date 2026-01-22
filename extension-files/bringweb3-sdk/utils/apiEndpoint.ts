export type EndpointName = string

export class ApiEndpoint {
  private static instance: ApiEndpoint | null = null;
  private readonly baseDomain: string = 'https://api.bringweb3.io';
  private readonly apiPath: string = 'v1/extension';
  private endpoint: EndpointName | '' = ''
  private whitelistEndpoint: string = '';
  private apiKey: string = '';

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

    switch (endpoint) {
      case 'prod':
        this.apiEndpoint = 'https://api.bringweb3.io/v1/extension'
        break;
      case 'sandbox':
        this.apiEndpoint = 'https://sandbox-api.bringweb3.io/v1/extension';
        break;
      case 'dev':
        this.apiEndpoint = 'https://sandbox-api.bringweb3.io/v1/extension'
        break;
      default:
        this.apiEndpoint = 'https://sandbox-api.bringweb3.io/v1/extension';
        break;
    }
  }

  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  public getWhitelistEndpoint(): string {
    return this.whitelistEndpoint;
  }

  public getBaseDomain(): string {
    return this.baseDomain;
  }

  public getApiPath(): string {
    return this.apiPath;
  }

  public getEndpoint(): EndpointName {
    if (!this.endpoint) {
      throw new Error('endpoint not set. Call setApiEndpoint first.');
    }
    return this.endpoint;
  }

  public getApiKey(): string {
    if (!this.apiKey) {
      throw new Error('API key not set. Call setApiKey first.');
    }
    return this.apiKey;
  }
}