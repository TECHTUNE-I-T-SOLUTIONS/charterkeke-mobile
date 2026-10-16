const {
  withAndroidManifest,
  withDangerousMod,
  withInfoPlist,
  withXcodeProject,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Lazy-load xcode inside the ios handler so the wrapper still loads on machines
// without the iOS toolchain (the package is a transitive dep of @expo/config-plugins).
let xcodeLib = null;
function getXcode() {
  if (xcodeLib) return xcodeLib;
  try {
    xcodeLib = require('xcode');
  } catch (e) {
    xcodeLib = false;
  }
  return xcodeLib;
}

const withDroptrackLive = (config) => {
  // ─── 1) Android manifest: POST_NOTIFICATIONS + POST_PROMOTED_NOTIFICATIONS + FCM service ───
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

  // ─── 2) Android res: copy notifications.wav + ic_tracker_keke.xml on prebuild ───
  config = withDangerousMod(config, [
    'android',
    async (mod) => {
      try {
        const srcSound = path.join(mod.modRequest.projectRoot, 'assets', 'sounds', 'notifications.wav');
        const destDirRaw = path.join(mod.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'raw');
        const destSound = path.join(destDirRaw, 'notifications.wav');
        if (fs.existsSync(srcSound)) {
          if (!fs.existsSync(destDirRaw)) fs.mkdirSync(destDirRaw, { recursive: true });
          fs.copyFileSync(srcSound, destSound);
          console.log('[droptrack-live] copied notifications.wav to', destSound);
        }
      } catch (e) {
        console.warn('[droptrack-live] sound copy failed:', e?.message);
      }
      try {
        const srcTracker = path.join(mod.modRequest.projectRoot, 'modules', 'droptrack-live', 'android', 'ic_tracker_keke.xml');
        const destDirDr = path.join(mod.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'drawable');
        const destTracker = path.join(destDirDr, 'ic_tracker_keke.xml');
        if (fs.existsSync(srcTracker)) {
          if (!fs.existsSync(destDirDr)) fs.mkdirSync(destDirDr, { recursive: true });
          fs.copyFileSync(srcTracker, destTracker);
          console.log('[droptrack-live] copied ic_tracker_keke.xml to', destTracker);
        }
      } catch (e) {
        console.warn('[droptrack-live] tracker copy failed:', e?.message);
      }
      return mod;
    },
  ]);

  // ─── 3) iOS: copy widget extension sources into the prebuilt iOS project ───
  config = withDangerousMod(config, [
    'ios',
    async (mod) => {
      try {
        const srcDir = path.join(mod.modRequest.projectRoot, 'modules', 'droptrack-live', 'ios', 'Widget');
        const destDir = path.join(mod.modRequest.platformProjectRoot, 'DroptrackWidget');
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        const files = [
          'DroptrackWidgetBundle.swift',
          'DeliveryLiveActivity.swift',
          'DeliveryAttributes.swift',
          'Info.plist',
        ];
        for (const file of files) {
          const src = path.join(srcDir, file);
          const dest = path.join(destDir, file);
          if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
            console.log('[droptrack-live] copied', file, '->', dest);
          } else {
            console.warn('[droptrack-live] widget source missing:', src);
          }
        }
      } catch (e) {
        console.warn('[droptrack-live] widget copy failed:', e?.message);
      }
      return mod;
    },
  ]);

  // ─── 4) iOS: register the widget extension target in the Xcode project ───
  config = withXcodeProject(config, (mod) => {
    const xcode = getXcode();
    if (!xcode) {
      console.warn('[droptrack-live] xcode package not available; skipping Xcode project patch');
      return mod;
    }
    try {
      const projectPath = path.join(mod.modRequest.platformProjectRoot, 'project.pbxproj');
      if (!fs.existsSync(projectPath)) {
        console.log('[droptrack-live] no project.pbxproj yet; will run when iOS project exists');
        return mod;
      }
      const project = xcode.project(projectPath);
      project.parseSync();

      // Skip if already registered
      const targets = project.pbxNativeTargetSection() || {};
      for (const uuid of Object.keys(targets)) {
        if (targets[uuid] && targets[uuid].name === 'DroptrackWidget') {
          console.log('[droptrack-live] widget extension already in project');
          return mod;
        }
      }

      // Add the widget extension target.
      // The xcode package's addTarget('app_extension') AUTOMATICALLY:
      //   1) creates a PBXCopyFilesBuildPhase in the first (main app) target
      //   2) adds the .appex product to it
      //   3) sets dstSubfolderSpec=13 (Plug-Ins) so it embeds as an app extension
      // So we don't need to manually add an "Embed App Extensions" phase.
      const widgetTarget = project.addTarget(
        'DroptrackWidget',
        'app_extension',
        'DroptrackWidget',
        'com.charterkeke.mobile.droptrackwidget'
      );

      // Add Swift source files
      const sources = [
        'DroptrackWidget/DroptrackWidgetBundle.swift',
        'DroptrackWidget/DeliveryLiveActivity.swift',
        'DroptrackWidget/DeliveryAttributes.swift',
      ];
      sources.forEach((f) => project.addSourceFile(f, { target: widgetTarget.uuid }));

      // Register Info.plist as a plain file reference (not a resource) and
      // point INFOPLIST_FILE at it. The system reads the Info.plist from the
      // .appex root via INFOPLIST_FILE; adding it to the resources phase would
      // also copy it into the bundle and cause a duplicate.
      project.addFile('DroptrackWidget/Info.plist', {
        target: widgetTarget.uuid,
        lastKnownFileType: 'text.plist.xml',
      });
      project.updateBuildProperty('INFOPLIST_FILE', 'DroptrackWidget/Info.plist', 'Release', widgetTarget.uuid);
      project.updateBuildProperty('INFOPLIST_FILE', 'DroptrackWidget/Info.plist', 'Debug', widgetTarget.uuid);
      project.updateBuildProperty('PRODUCT_NAME', 'DroptrackWidget', 'Release', widgetTarget.uuid);
      project.updateBuildProperty('PRODUCT_NAME', 'DroptrackWidget', 'Debug', widgetTarget.uuid);
      project.updateBuildProperty('PRODUCT_BUNDLE_IDENTIFIER', 'com.charterkeke.mobile.droptrackwidget', 'Release', widgetTarget.uuid);
      project.updateBuildProperty('PRODUCT_BUNDLE_IDENTIFIER', 'com.charterkeke.mobile.droptrackwidget', 'Debug', widgetTarget.uuid);
      project.updateBuildProperty('SKIP_INSTALL', 'YES', 'Release', widgetTarget.uuid);
      project.updateBuildProperty('SKIP_INSTALL', 'YES', 'Debug', widgetTarget.uuid);
      project.updateBuildProperty('LD_RUNPATH_SEARCH_PATHS', '$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks', 'Release', widgetTarget.uuid);
      project.updateBuildProperty('LD_RUNPATH_SEARCH_PATHS', '$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks', 'Debug', widgetTarget.uuid);

      // Link required frameworks
      ['WidgetKit.framework', 'ActivityKit.framework', 'SwiftUI.framework'].forEach((fw) => {
        project.addFramework(fw, { target: widgetTarget.uuid });
      });

      // Bump widget deployment target — Live Activities need 16.2+
      project.updateBuildProperty('IPHONEOS_DEPLOYMENT_TARGET', '16.2', 'Release', widgetTarget.uuid);
      project.updateBuildProperty('IPHONEOS_DEPLOYMENT_TARGET', '16.2', 'Debug', widgetTarget.uuid);

      // Find main app target and bump its deployment target to 16.2 —
      // ActivityKit needs it (the @available checks gate the actual calls,
      // but the binary must be 16.2+ to use the API at runtime).
      const mainTargetUuid = project.getFirstTarget().uuid;
      if (mainTargetUuid) {
        try {
          const current = project.getBuildProperty('IPHONEOS_DEPLOYMENT_TARGET', 'Release', mainTargetUuid);
          const cur = parseFloat(String(current || '').replace(/[^\d.]/g, ''));
          if (!cur || cur < 16.2) {
            project.updateBuildProperty('IPHONEOS_DEPLOYMENT_TARGET', '16.2', 'Release', mainTargetUuid);
            project.updateBuildProperty('IPHONEOS_DEPLOYMENT_TARGET', '16.2', 'Debug', mainTargetUuid);
            console.log('[droptrack-live] bumped main app deployment target to 16.2');
          }
        } catch (e) {
          // Safe fallback — still bump to 16.2
          project.updateBuildProperty('IPHONEOS_DEPLOYMENT_TARGET', '16.2', 'Release', mainTargetUuid);
          project.updateBuildProperty('IPHONEOS_DEPLOYMENT_TARGET', '16.2', 'Debug', mainTargetUuid);
        }
      }

      fs.writeFileSync(projectPath, project.writeSync());
      console.log('[droptrack-live] widget extension added to Xcode project');
    } catch (e) {
      console.warn('[droptrack-live] Xcode project patch failed:', e?.message);
    }
    return mod;
  });

  // ─── 5) iOS Info.plist: enable Live Activities + frequent updates ───
  config = withInfoPlist(config, (mod) => {
    mod.modResults['NSSupportsLiveActivities'] = true;
    mod.modResults['NSSupportsLiveActivitiesFrequentUpdates'] = true;
    return mod;
  });

  return config;
};

module.exports = withDroptrackLive;
