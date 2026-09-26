const INSTAGRAM_URL = /https?:\/\/(?:www\.|m\.)?instagram\.com\/[^\s<>"']+/i;
const INSTAGRAM_POST_PATH = /\/(?:reel|reels|p|tv)\/[A-Za-z0-9_-]+/i;

/**
 * Pull an Instagram reel/post link out of whatever a share sheet hands us:
 * a bare URL, or text like "Check this out https://www.instagram.com/reel/…".
 */
export function extractInstagramUrl(text?: string | null): string | null {
  if (!text) return null;
  const match = text.match(INSTAGRAM_URL);
  if (!match) return null;
  const url = match[0].replace(/[)\]}>,.;!?'"]+$/, '');
  return INSTAGRAM_POST_PATH.test(url) ? url : null;
}

export function isInstagramUrl(text: string): boolean {
  return extractInstagramUrl(text) !== null;
}
