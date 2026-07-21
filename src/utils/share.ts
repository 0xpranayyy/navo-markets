export async function shareMarket(question: string, marketId: string): Promise<boolean> {
  const url = `${window.location.origin}${window.location.pathname}#/app/market/${encodeURIComponent(marketId)}`;
  const text = `Check out this market on Navo: ${question}`;

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: 'Navo', text, url });
      return true;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return false;
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
