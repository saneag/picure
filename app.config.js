// PICURE_RELEASE=1 strips the INTERNET permission so release builds cannot reach the network.
// Debug builds keep it because Metro needs it.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    blockedPermissions: process.env.PICURE_RELEASE
      ? ['android.permission.INTERNET', 'android.permission.RECORD_AUDIO']
      : [],
  },
});
