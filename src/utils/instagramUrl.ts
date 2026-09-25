/**
 * Best-effort extraction of an Instagram post/reel URL out of arbitrary
 * shared text. Used by both the Android share-intent handler (AppNavigator)
 * and the iOS share extension (ShareExtensionRoot), since neither platform
 * guarantees the shared payload is *just* the URL.
 */
export function extractInstagramUrl(text?: string | null): string | null {
  if (!text) return null;
  const match = text.match(/https?:\/\/(www\.)?instagram\.com\/\S+/i);
  if (!match) return null;
  return match[0].replace(/[)\]}>,.'"]+$/, '');
}
