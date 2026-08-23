import { resolveMobileExperienceMode } from '../../../src/config/mobileExperience';

describe('resolveMobileExperienceMode', () => {
  it.each([undefined, null, '', 'native', 'unexpected'])(
    'falls back to the stable WebView for %p',
    (value) => {
      expect(resolveMobileExperienceMode(value)).toBe('webview');
    },
  );

  it('allows an explicitly requested native preview', () => {
    expect(resolveMobileExperienceMode('native-preview')).toBe(
      'native-preview',
    );
  });
});
