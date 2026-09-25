import { extractInstagramUrl } from '../instagramUrl';

describe('extractInstagramUrl', () => {
  it('returns the URL when the shared text is just the link', () => {
    expect(extractInstagramUrl('https://www.instagram.com/reel/C-zW68moPMC/')).toBe(
      'https://www.instagram.com/reel/C-zW68moPMC/'
    );
  });

  it('pulls the link out of surrounding text', () => {
    const shared = 'Check this out! https://www.instagram.com/reel/C-zW68moPMC/?igsh=abc123 so cool';
    expect(extractInstagramUrl(shared)).toBe('https://www.instagram.com/reel/C-zW68moPMC/?igsh=abc123');
  });

  it('strips trailing punctuation picked up by the regex', () => {
    expect(extractInstagramUrl('Look at this: https://www.instagram.com/reel/abc123/.')).toBe(
      'https://www.instagram.com/reel/abc123/'
    );
  });

  it('returns null for non-Instagram text', () => {
    expect(extractInstagramUrl('just some random text with no link')).toBeNull();
  });

  it('returns null for nullish input', () => {
    expect(extractInstagramUrl(null)).toBeNull();
    expect(extractInstagramUrl(undefined)).toBeNull();
    expect(extractInstagramUrl('')).toBeNull();
  });
});
