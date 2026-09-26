/**
 * iOS fix-ups that run after every other plugin:
 * - The share sheet shows the extension's display name; expo-share-extension
 *   defaults it to "<Target> Share Extension". Show "Memory Map" instead.
 * - The app only sends local notifications (nearby alerts), so drop the push
 *   entitlement expo-notifications adds - it would otherwise require a Push
 *   Notifications capability in the provisioning profile for no reason.
 */
const fs = require('fs');
const path = require('path');
const plist = require('@expo/plist').default;
const { IOSConfig, withFinalizedMod } = require('expo/config-plugins');

const editPlist = (file, edit) => {
  if (!fs.existsSync(file)) return;
  const data = plist.parse(fs.readFileSync(file, 'utf8'));
  edit(data);
  fs.writeFileSync(file, plist.build(data));
};

module.exports = (config) =>
  withFinalizedMod(config, [
    'ios',
    (config) => {
      const root = config.modRequest.platformProjectRoot;
      const app = IOSConfig.XcodeUtils.sanitizedName(config.name);
      editPlist(path.join(root, `${app}ShareExtension`, 'Info.plist'), (info) => {
        info.CFBundleDisplayName = config.name;
      });
      editPlist(path.join(root, app, `${app}.entitlements`), (entitlements) => {
        delete entitlements['aps-environment'];
      });
      return config;
    },
  ]);
