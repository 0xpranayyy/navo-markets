export function isNativePlatform(): boolean {
  try {
    // Capacitor injects this on native builds
    return Boolean((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());
  } catch {
    return false;
  }
}

export async function loadCapacitor<T>(moduleName: string): Promise<T | null> {
  if (!isNativePlatform()) return null;
  try {
    return await import(/* @vite-ignore */ moduleName) as T;
  } catch {
    return null;
  }
}
