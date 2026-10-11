// Component: n8 Electron Main Process
import { PythonServiceManager } from './service/pythonManager.ts';
import { CredentialStore } from './secrets/credentialStore.ts';
import { IPCGateway } from './ipc/gateway.ts';

export interface AppBootstrapOptions {
  devMode?: boolean;
}

export class DesktopAppCore {
  public pythonManager: PythonServiceManager;
  public credentialStore: CredentialStore;
  public gateway: IPCGateway;

  constructor() {
    this.pythonManager = new PythonServiceManager();
    this.credentialStore = new CredentialStore();
    this.gateway = new IPCGateway(this.pythonManager, this.credentialStore);
  }

  public getSecureWindowOptions() {
    return {
      width: 1280,
      height: 800,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
      },
    };
  }

  public async initialize(): Promise<{ success: boolean; engineHealth: unknown }> {
    console.log('[n8 Main Process] Bootstrapping Dexter Presentation Studio...');
    const pythonStarted = await this.pythonManager.startService();

    if (!pythonStarted) {
      console.error('[n8 Main Process] Failed to start Python Engine service.');
      return { success: false, engineHealth: this.pythonManager.getStatus() };
    }

    console.log('[n8 Main Process] Python Engine started and listening on 127.0.0.1.');
    const health = this.pythonManager.getStatus();
    return { success: true, engineHealth: health };
  }

  public async shutdown(): Promise<void> {
    console.log('[n8 Main Process] Shutting down application and stopping Python Engine...');
    await this.pythonManager.stopService();
    console.log('[n8 Main Process] Python Engine stopped cleanly.');
  }
}
