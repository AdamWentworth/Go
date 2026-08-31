const {
  AndroidConfig,
  withAndroidStyles,
  withMainActivity,
} = require('@expo/config-plugins');

const FULL_SCREEN_MODAL_ITEMS = [
  ['android:windowNoTitle', 'true'],
  ['android:windowIsFloating', 'false'],
  ['android:windowBackground', '@android:color/transparent'],
  ['android:windowDrawsSystemBarBackgrounds', 'true'],
  ['android:statusBarColor', '@android:color/transparent'],
  ['android:navigationBarColor', '@android:color/transparent'],
  ['android:enforceNavigationBarContrast', 'false'],
];

const assignStyleItems = (styles, parent, items) => items.reduce(
  (current, [name, value]) => AndroidConfig.Styles.assignStylesValue(current, {
    add: true,
    name,
    parent,
    value,
  }),
  styles,
);

const ensureStyleGroup = (styles, name) => {
  const next = AndroidConfig.Resources.ensureDefaultResourceXML(styles);
  next.resources.style ??= [];
  if (!AndroidConfig.Resources.findResourceGroup(next.resources.style, { name })) {
    next.resources.style.push(AndroidConfig.Resources.buildResourceGroup({ name }));
  }
  return next;
};

const applyTransparentNavigationStyles = (styles) => {
  let next = assignStyleItems(
    styles,
    AndroidConfig.Styles.getAppThemeGroup(),
    [
      ['android:navigationBarColor', '@android:color/transparent'],
      ['android:enforceNavigationBarContrast', 'false'],
    ],
  );

  // React Native Modal uses a ComponentDialog with Theme.FullScreenDialog,
  // not AppTheme. Without a modal-specific override, physical Android builds
  // can still insert an opaque navigation-area band even though the activity
  // itself is correctly edge-to-edge. Redeclare React Native's required
  // full-screen attributes and make that dialog window transparent too.
  next = ensureStyleGroup(next, 'Theme.FullScreenDialog');
  return assignStyleItems(next, { name: 'Theme.FullScreenDialog' }, FULL_SCREEN_MODAL_ITEMS);
};

const applyEdgeToEdgeMainActivity = (contents) => {
  let next = contents;
  if (!next.includes('import androidx.core.view.WindowCompat')) {
    next = next.replace(
      'import android.os.Bundle',
      'import android.os.Bundle\nimport androidx.core.view.WindowCompat',
    );
  }
  if (!next.includes('WindowCompat.setDecorFitsSystemWindows(window, false)')) {
    next = next.replace(
      'super.onCreate(null)',
      'super.onCreate(null)\n    WindowCompat.setDecorFitsSystemWindows(window, false)',
    );
  }
  return next;
};

/**
 * Android can apply an opaque navigation background to both the activity and
 * React Native's separate full-screen Modal window. The app already draws
 * edge-to-edge and owns safe-area placement, so keep both windows transparent
 * in gesture and three-button modes.
 */
module.exports = (config) => {
  const styledConfig = withAndroidStyles(config, (stylesConfig) => {
    stylesConfig.modResults = applyTransparentNavigationStyles(stylesConfig.modResults);
    return stylesConfig;
  });
  return withMainActivity(styledConfig, (activityConfig) => {
    activityConfig.modResults.contents = applyEdgeToEdgeMainActivity(
      activityConfig.modResults.contents,
    );
    return activityConfig;
  });
};

module.exports.applyTransparentNavigationStyles = applyTransparentNavigationStyles;
module.exports.applyEdgeToEdgeMainActivity = applyEdgeToEdgeMainActivity;
