const { withProjectBuildGradle } = require('@expo/config-plugins');

const EXCLUSION_BLOCK = `
// Charter Keke: keep AndroidX and legacy support libraries from entering
// the same release classpath. Some old transitive dependencies may still
// request com.android.support:*; AndroidX already supplies the Jetifier
// compatibility classes, so the legacy artifacts must be excluded.
subprojects {
  configurations.configureEach {
    exclude group: 'com.android.support'
  }
}
`;

module.exports = function withAndroidxSupportExcludes(config) {
  return withProjectBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes("exclude group: 'com.android.support'")) {
      config.modResults.contents = `${config.modResults.contents.trim()}\n${EXCLUSION_BLOCK}`;
    }

    return config;
  });
};
