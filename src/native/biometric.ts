import { isNativePlatform, loadCapacitor } from './platform';

const BIO_KEY = 'navo-biometric-lock';

export function isBiometricEnabled(): boolean {
  return localStorage.getItem(BIO_KEY) === '1';
}

export function setBiometricEnabled(enabled: boolean) {
  localStorage.setItem(BIO_KEY, enabled ? '1' : '0');
}

/** True only on native Capacitor builds with biometric hardware. */
export async function isBiometricAvailable(): Promise<boolean> {
  if (!isNativePlatform()) return false;

  const mod = await loadCapacitor<{ NativeBiometric: {
    isAvailable: () => Promise<{ isAvailable: boolean }>;
  } }>('@capgo/capacitor-native-biometric');

  if (mod?.NativeBiometric) {
    const res = await mod.NativeBiometric.isAvailable();
    return res.isAvailable;
  }
  return false;
}

export async function verifyBiometric(reason = 'Unlock Navo'): Promise<boolean> {
  if (!isNativePlatform()) return false;

  const mod = await loadCapacitor<{ NativeBiometric: {
    verifyIdentity: (opts: { reason: string }) => Promise<void>;
  } }>('@capgo/capacitor-native-biometric');

  if (mod?.NativeBiometric) {
    try {
      await mod.NativeBiometric.verifyIdentity({ reason });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export async function authenticateBiometric(reason = 'Unlock Navo'): Promise<boolean> {
  if (!isBiometricEnabled()) return true;
  if (!isNativePlatform()) {
    // Web PWA: biometric lock is not supported — never block the app
    return true;
  }
  return verifyBiometric(reason);
}
