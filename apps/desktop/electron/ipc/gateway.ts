// Component: n10 IPC Gateway (تحقق المسارات وبوابة الوساطة)
import { PythonServiceManager } from '../service/pythonManager.ts';
import { CredentialStore } from '../secrets/credentialStore.ts';
import { validateSafePath } from './pathGuard.ts';

export class IPCGateway {
  constructor(
    private pythonManager: PythonServiceManager,
    private credentialStore: CredentialStore
  ) {}

  public async forwardToEngine(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const port = this.pythonManager.getPort();
    const token = this.pythonManager.getToken();

    if (!port || !token) {
      throw new Error('Python Engine service is not currently active');
    }

    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);

    const url = `http://127.0.0.1:${port}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    return fetch(url, {
      ...options,
      headers,
    });
  }

  public validatePath(filePath: string, allowedRoots?: string[]) {
    return validateSafePath(filePath, allowedRoots);
  }

  public getServiceHealth() {
    return this.pythonManager.getStatus();
  }

  public listMaskedSecrets() {
    return this.credentialStore.listMaskedCredentials();
  }

  public setSecret(providerId: string, apiKey: string) {
    this.credentialStore.setApiKey(providerId, apiKey);
    return { success: true, providerId };
  }
}
