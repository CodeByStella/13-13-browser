import http from 'node:http';

const RETRY_MS = 200;
const MAX_ATTEMPTS = 60;

/** Use IPv4 loopback — on Windows, `localhost` often resolves to ::1 while Vite binds 127.0.0.1 */
export function normalizeDevServerUrl(url: string): string {
  const parsed = new URL(url);
  if (parsed.hostname === 'localhost' || parsed.hostname === '[::1]') {
    parsed.hostname = '127.0.0.1';
  }
  return parsed.href.endsWith('/') ? parsed.href : `${parsed.href}/`;
}

export async function waitForDevServer(url: string): Promise<boolean> {
  const target = normalizeDevServerUrl(url);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (await ping(target)) return true;
    await sleep(RETRY_MS);
  }

  return false;
}

function ping(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const parsed = new URL(url);

    const req = http.get(
      {
        hostname: parsed.hostname,
        port: parsed.port || 5173,
        path: parsed.pathname || '/',
        family: 4,
        timeout: 1000,
      },
      (res) => {
        res.resume();
        resolve(res.statusCode !== undefined && res.statusCode < 500);
      },
    );

    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
