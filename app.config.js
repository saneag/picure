// PICURE_RELEASE=1 strips the INTERNET permission so release builds cannot reach the network.
// Debug builds keep it because Metro needs it.
const { withAndroidStyles } = require('expo/config-plugins');

// Stops Android from drawing its own translucent scrim behind the 3-button navigation bar.
const withoutNavigationBarScrim = (config) =>
  withAndroidStyles(config, (mod) => {
    const theme = mod.modResults.resources.style.find((style) => style.$.name === 'AppTheme');
    theme.item.push({ $: { name: 'android:enforceNavigationBarContrast' }, _: 'false' });
    return mod;
  });

module.exports = ({ config }) =>
  withoutNavigationBarScrim({
    ...config,
    android: {
      ...config.android,
      blockedPermissions: process.env.PICURE_RELEASE
        ? ['android.permission.INTERNET', 'android.permission.RECORD_AUDIO']
        : [],
    },
  });
