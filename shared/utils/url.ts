export function isSecureUrl(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

export function isHttpUrl(url: string): boolean {
  try {
    const protocol = new URL(url).protocol;
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

/** Windows, macOS, or Linux filesystem path (not a web URL). */
export function isLocalFilePath(input: string): boolean {
  const trimmed = input.trim().replace(/^["']|["']$/g, '');
  if (!trimmed) return false;
  if (/^file:\/\//i.test(trimmed)) return true;
  if (/^[a-zA-Z]:[\\/]/.test(trimmed)) return true;
  if (/^\\\\[^\\]+\\/.test(trimmed)) return true;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true;
  if ((trimmed.startsWith('~') || trimmed.startsWith('.')) && /[\\/]/.test(trimmed)) return true;
  return false;
}

/** Alias used by toolbar and main-process permission panels. */
export const isManageableSiteUrl = isHttpUrl;

export function originFromHttpUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

export function bookmarkLabel(title: string, url: string): string {
  const trimmed = title.trim();
  if (trimmed && trimmed !== url && !trimmed.startsWith('http')) return trimmed;

  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return trimmed || url;
  }
}

export function faviconUrl(url: string): string | null {
  try {
    const { hostname } = new URL(url);
    if (!hostname) return null;
    return `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
  } catch {
    return null;
  }
}

/** Human-readable URL for the address bar (omits redundant trailing slashes). */
export function formatAddressBarUrl(url: string): string {
  if (!url) return url;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return url;

    if (parsed.pathname === '/' && !parsed.search && !parsed.hash) {
      return parsed.origin;
    }

    if (parsed.pathname.endsWith('/') && parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.replace(/\/+$/, '');
      return parsed.toString();
    }

    return url;
  } catch {
    return url.replace(/\/+$/, '') || url;
  }
}
