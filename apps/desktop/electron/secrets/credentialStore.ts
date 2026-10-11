// Component: n44 مخزن الأسرار (Credential Mgr / safeStorage)
import crypto from 'crypto';

export interface MaskedCredential {
  providerId: string;
  maskedKey: string;
  configuredAt: string;
}

export class CredentialStore {
  // Encrypted store using an ephemeral session key (or DPAPI on Windows native)
  private masterKey = crypto.randomBytes(32);
  private store = new Map<string, { iv: string; encrypted: string; lastFour: string; configuredAt: string }>();

  public setApiKey(providerId: string, apiKey: string): void {
    if (!apiKey || apiKey.length < 6) {
      throw new Error('API key must be at least 6 characters');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    const lastFour = apiKey.slice(-4);
    this.store.set(providerId, {
      iv: iv.toString('hex') + ':' + authTag,
      encrypted,
      lastFour,
      configuredAt: new Date().toISOString(),
    });
  }

  public getApiKey(providerId: string): string | null {
    const entry = this.store.get(providerId);
    if (!entry) return null;

    try {
      const [ivHex, tagHex] = entry.iv.split(':');
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, Buffer.from(ivHex, 'hex'));
      decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
      let decrypted = decipher.update(entry.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return null;
    }
  }

  public deleteApiKey(providerId: string): boolean {
    return this.store.delete(providerId);
  }

  public listMaskedCredentials(): MaskedCredential[] {
    const result: MaskedCredential[] = [];
    for (const [providerId, entry] of this.store.entries()) {
      result.push({
        providerId,
        maskedKey: `••••••••${entry.lastFour}`,
        configuredAt: entry.configuredAt,
      });
    }
    return result;
  }
}
