const { AndroidConfig, withAndroidStyles } = require('@expo/config-plugins');

/**
 * Android applies a contrast scrim behind three-button navigation by default,
 * which creates a false horizontal seam across full-window gradients. The app
 * already draws edge-to-edge and owns safe-area placement, so keep the system
 * navigation bar transparent in both gesture and three-button modes.
 */
module.exports = (config) => withAndroidStyles(config, (stylesConfig) => {
  stylesConfig.modResults = AndroidConfig.Styles.assignStylesValue(
    stylesConfig.modResults,
    {
      add: true,
      name: 'android:enforceNavigationBarContrast',
      parent: AndroidConfig.Styles.getAppThemeGroup(),
      value: 'false',
    },
  );
  return stylesConfig;
});
