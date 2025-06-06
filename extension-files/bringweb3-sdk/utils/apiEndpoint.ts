
export class ApiEndpoint {
  private static instance: ApiEndpoint | null = null;
  private apiEndpoint: string = '';
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
    this.apiEndpoint = endpoint === 'prod'
      ? 'https://api.bringweb3.io/v1/extension'
      : 'https://sandbox-api.bringweb3.io/v1/extension';
  }

  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  public getWhitelistEndpoint(): string {
    return this.whitelistEndpoint;
  }

  public getApiEndpoint(): string {
    if (!this.apiEndpoint) {
      throw new Error('API endpoint not set. Call setApiEndpoint first.');
    }
    return this.apiEndpoint;
  }

  public getApiKey(): string {
    if (!this.apiKey) {
      throw new Error('API key not set. Call setApiKey first.');
    }
    return this.apiKey;
  }
}