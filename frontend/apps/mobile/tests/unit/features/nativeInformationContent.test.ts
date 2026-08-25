import {
  isNativeInformationSlug,
  NATIVE_INFORMATION_PAGES,
} from '../../../src/features/information/nativeInformationContent';

describe('native information content', () => {
  it('keeps every canonical public information route available natively', () => {
    expect(Object.keys(NATIVE_INFORMATION_PAGES).sort()).toEqual([
      'about', 'data-deletion', 'faq', 'getting-started', 'help',
      'privacy', 'safety', 'terms',
    ]);
    for (const [slug, page] of Object.entries(NATIVE_INFORMATION_PAGES)) {
      expect(page.slug).toBe(slug);
      expect(page.title).not.toBe('');
      expect(page.sections.length).toBeGreaterThan(0);
      expect(isNativeInformationSlug(slug)).toBe(true);
    }
    expect(isNativeInformationSlug('not-real')).toBe(false);
  });

  it('retains the complete six-step collection-to-trade guide', () => {
    expect(NATIVE_INFORMATION_PAGES['getting-started'].sections.map(({ id }) => id)).toEqual([
      'collection', 'wanted', 'for-trade', 'discovery', 'proposal', 'sharing',
    ]);
  });
});
