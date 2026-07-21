import { BUILDER_HEALTH_URL } from './trading/constants';

export async function isBuilderConfigured(): Promise<boolean> {
  try {
    const res = await fetch(BUILDER_HEALTH_URL);
    if (!res.ok) return false;
    const data = (await res.json()) as { configured?: boolean };
    return Boolean(data.configured);
  } catch {
    return false;
  }
}
