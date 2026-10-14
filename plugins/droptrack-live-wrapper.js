const { withAndroidManifest, withDangerousMod, withInfoPlist } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withDroptrackLive = (config) => {
  // 1) Ensure AndroidManifest has live-update permissions and FCM service if missing
  config = withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    if (!manifest['uses-permission']) manifest['uses-permission'] = [];

    const needed = [
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.POST_PROMOTED_NOTIFICATIONS',
    ];
    for (const perm of needed) {
      const exists = manifest['uses-permission'].some((p) => p.$?.['android:name'] === perm);
      if (!exists) {
        manifest['uses-permission'].push({ $: { 'android:name': perm } });
      }
    }

    // Ensure FCM service is declared (the Kotlin DroptrackFcmService needs this to run even when app is dead)
    try {
      const apps = manifest.application || [];
      for (const app of apps) {
        if (!app.service) app.service = [];
        const hasFcm = app.service.some((s) => String(s.$?.['android:name'] || '').includes('DroptrackFcmService'));
        if (!hasFcm) {
          app.service.push({
            $: {
              'android:name': 'com.droptrack.live.DroptrackFcmService',
              'android:exported': 'false',
            },
            'intent-filter': [{ action: [{ $: { 'android:name': 'com.google.firebase.MESSAGING_EVENT' } }] }],
          });
        }
      }
    } catch (e) {
      console.warn('[droptrack-live] manifest patch skip:', e?.message);
    }

    return mod;
  });

  // 2) Ensure custom notification sound is in android res/raw during prebuild (expo prebuild --clean wipes it)
  config = withDangerousMod(config, [
    'android',
    async (mod) => {
      const src = path.join(mod.modRequest.projectRoot, 'assets', 'sounds', 'notifications.wav');
      const destDir = path.join(mod.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'raw');
      const dest = path.join(destDir, 'notifications.wav');
      try {
        if (fs.existsSync(src)) {
          if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
          fs.copyFileSync(src, dest);
          console.log('[droptrack-live] copied notifications.wav to', dest);
        } else {
          console.warn('[droptrack-live] sound source missing:', src);
        }
      } catch (e) {
        console.warn('[droptrack-live] sound copy failed:', e?.message);
      }
      return mod;
    },
  ]);

  // 3) iOS: enable Live Activities. The system renders the lock-screen/Dynamic-Island card from the SwiftUI widget;
  // we only need NSSupportsLiveActivities (+ frequent update flag for rapid driver pings) on the main target.
  config = withInfoPlist(config, (mod) => {
    mod.modResults['NSSupportsLiveActivities'] = true;
    mod.modResults['NSSupportsLiveActivitiesFrequentUpdates'] = true;
    return mod;
  });

  return config;
};

module.exports = withDroptrackLive;
