const {
  applyEdgeToEdgeMainActivity,
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

  it('forces the main Activity content to occupy the same edge-to-edge window as modals', () => {
    const source = `package com.pokegonexus.app
import android.os.Bundle

class MainActivity {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
  }
}`;
    const transformed = applyEdgeToEdgeMainActivity(source);

    expect(transformed).toContain('import androidx.core.view.WindowCompat');
    expect(transformed).toContain('WindowCompat.setDecorFitsSystemWindows(window, false)');
    expect(applyEdgeToEdgeMainActivity(transformed)).toBe(transformed);
  });
});
