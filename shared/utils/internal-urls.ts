/** Canonical address bar URL for the built-in snake game. */
export const SNAKE_GAME_ADDRESS = 'chrome://snake';

export interface InternalBrowserPage {
  href: string;
  display: string;
}

export function resolveInternalBrowserUrl(
  input: string,
  errorPageBaseUrl: string,
): InternalBrowserPage | null {
  const trimmed = input.trim().replace(/\/+$/, '');
  if (trimmed.toLowerCase() !== SNAKE_GAME_ADDRESS) return null;

  const base = errorPageBaseUrl.split('?')[0];
  return {
    href: `${base}?mode=game`,
    display: SNAKE_GAME_ADDRESS,
  };
}

export function isSnakeGamePageUrl(pageUrl: string): boolean {
  try {
    return new URL(pageUrl).searchParams.get('mode') === 'game';
  } catch {
    return pageUrl.includes('mode=game');
  }
}
