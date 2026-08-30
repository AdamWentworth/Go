const {
  applyTransparentNavigationStyles,
} = require('../../../plugins/with-transparent-navigation-bar');
const { describe, expect, it } = require('@jest/globals');

const styleItems = (styles, name) => Object.fromEntries(
  styles.resources.style
    .find((style) => style.$.name === name)
    .item
    .map((item) => [item.$.name, item._]),
);

describe('with-transparent-navigation-bar', () => {
  it('configures both the activity and React Native full-screen modal windows', () => {
    const styles = applyTransparentNavigationStyles({
      resources: {
        style: [{ $: { name: 'AppTheme' }, item: [] }],
      },
    });

    expect(styleItems(styles, 'AppTheme')).toMatchObject({
      'android:enforceNavigationBarContrast': 'false',
      'android:navigationBarColor': '@android:color/transparent',
    });
    expect(styleItems(styles, 'Theme.FullScreenDialog')).toEqual({
      'android:enforceNavigationBarContrast': 'false',
      'android:navigationBarColor': '@android:color/transparent',
      'android:statusBarColor': '@android:color/transparent',
      'android:windowBackground': '@android:color/transparent',
      'android:windowDrawsSystemBarBackgrounds': 'true',
      'android:windowIsFloating': 'false',
      'android:windowNoTitle': 'true',
    });
  });

  it('updates existing style groups without creating duplicates', () => {
    const styles = applyTransparentNavigationStyles(applyTransparentNavigationStyles({
      resources: {
        style: [{ $: { name: 'AppTheme' }, item: [] }],
      },
    }));

    expect(styles.resources.style.filter((style) => style.$.name === 'AppTheme')).toHaveLength(1);
    expect(styles.resources.style.filter((style) => style.$.name === 'Theme.FullScreenDialog')).toHaveLength(1);
  });
});
