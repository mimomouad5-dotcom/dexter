// Component: n9 Preload محدود (contextIsolation)
import { z } from 'zod';

export const PathSchema = z.string().min(1);
export const SecretSchema = z.object({
  providerId: z.string().min(1),
  apiKey: z.string().min(6),
});
export const TaskSchema = z.object({
  type: z.enum(['outline', 'content', 'research', 'import-library', 'export-pptx']),
  payload: z.record(z.string(), z.unknown()),
});

export interface DexterWindowAPI {
  system: {
    getHealth: () => Promise<{ status: string; engine: unknown }>;
    getInfo: () => Promise<unknown>;
  };
  secrets: {
    listMasked: () => Promise<Array<{ providerId: string; maskedKey: string; configuredAt: string }>>;
    setKey: (providerId: string, apiKey: string) => Promise<{ success: boolean; providerId: string }>;
  };
  path: {
    validate: (filePath: string) => { valid: boolean; error?: string };
  };
}

// In standard Electron execution, contextBridge.exposeInMainWorld is used.
// Here we export the typed interface and contract builder for both Node tests and renderer usage.
export function createSafeAPIBridge(gatewayBridge: any): DexterWindowAPI {
  return {
    system: {
      getHealth: async () => {
        return gatewayBridge.getHealth();
      },
      getInfo: async () => {
        return gatewayBridge.getInfo();
      },
    },
    secrets: {
      listMasked: async () => {
        return gatewayBridge.listMaskedSecrets();
      },
      setKey: async (providerId: string, apiKey: string) => {
        const validated = SecretSchema.parse({ providerId, apiKey });
        return gatewayBridge.setSecret(validated.providerId, validated.apiKey);
      },
    },
    path: {
      validate: (filePath: string) => {
        const validPath = PathSchema.parse(filePath);
        return gatewayBridge.validatePath(validPath);
      },
    },
  };
}
