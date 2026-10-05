import { ProviderError } from '../types';
import type { FetchFn } from '../types';

const TIMEOUT_MS = 4000;

/** GET JSON from a URL built in code from whitelisted currency codes (never client-supplied), with a
 *  timeout and no redirect following. */
export async function getJson(fetchFn: FetchFn, url: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetchFn(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: 'application/json' },
      redirect: 'error',
    });
  } catch (err) {
    const timedOut =
      err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
    throw new ProviderError(
      timedOut ? 'timeout' : 'network',
      timedOut ? 'timed out' : 'request failed',
    );
  }
  if (!res.ok) throw new ProviderError('http', `status ${res.status}`);
  try {
    return await res.json();
  } catch {
    throw new ProviderError('malformed', 'invalid JSON');
  }
}
