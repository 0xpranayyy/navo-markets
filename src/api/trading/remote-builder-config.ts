import type { WalletClient } from 'viem';
import { SIGN_URL } from './constants';
import { signBuilderAuth } from './sign-auth';

export interface BuilderHeaderPayload {
  POLY_BUILDER_API_KEY: string;
  POLY_BUILDER_PASSPHRASE: string;
  POLY_BUILDER_SIGNATURE: string;
  POLY_BUILDER_TIMESTAMP: string;
}

/** Browser-safe remote builder config — HMAC secret stays on the sign server. */
export class RemoteBuilderConfig {
  constructor(
    private readonly url: string = SIGN_URL,
    private readonly walletClient: WalletClient | null = null,
  ) {}

  async generateBuilderHeaders(
    method: string,
    path: string,
    body?: unknown,
    timestamp?: number,
  ): Promise<BuilderHeaderPayload | undefined> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected for builder signing');
    }

    const auth = await signBuilderAuth(this.walletClient, method, path);
    const res = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ method, path, body, timestamp, ...auth }),
    });

    if (!res.ok) {
      let detail = `Sign server error (${res.status})`;
      try {
        const data = (await res.json()) as { error?: string };
        if (data.error) detail = data.error;
      } catch {
        // ignore parse errors
      }
      throw new Error(detail);
    }

    return (await res.json()) as BuilderHeaderPayload;
  }

  isValid(): boolean {
    return (
      Boolean(this.walletClient?.account) &&
      (this.url.startsWith('http://') ||
        this.url.startsWith('https://') ||
        this.url.startsWith('/'))
    );
  }
}
