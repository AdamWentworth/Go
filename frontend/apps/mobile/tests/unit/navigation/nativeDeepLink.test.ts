import { resolveNativeDeepLink } from '../../../src/navigation/nativeDeepLink';

describe('resolveNativeDeepLink', () => {
  test.each([
    ['https://pokegonexus.com/', '/native'],
    ['https://pokegonexus.com/getting-started', '/native/info/getting-started'],
    ['https://pokegonexus.com/profile/Misty', '/native/profile/Misty'],
    ['https://pokegonexus.com/profile/friends', '/native/friends'],
    ['https://pokegonexus.com/pokemon/Misty?filter=trade', '/native/collection/trainer/Misty?filter=trade'],
    ['https://pokegonexus.com/trade-board/Misty', '/native/trade-board/Misty'],
    ['https://pokegonexus.com/settings/account', '/native/account'],
    ['https://pokegonexus.com/verify-email-change?token=abc', '/native/verify-email-change?token=abc'],
    ['pokegonexus://native/account', '/native/account'],
    ['/native/search?mode=trainers', '/native/search?mode=trainers'],
  ])('maps %s to %s', (incoming, expected) => {
    expect(resolveNativeDeepLink(incoming)).toBe(expected);
  });

  it('routes unknown and malformed paths to recoverable native not-found state', () => {
    expect(resolveNativeDeepLink('https://pokegonexus.com/retired?page=2'))
      .toBe('/native/not-found?path=%2Fretired%3Fpage%3D2');
    expect(() => resolveNativeDeepLink('/profile/%E0%A4%A')).not.toThrow();
  });
});
