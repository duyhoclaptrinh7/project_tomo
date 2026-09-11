const {
  AndroidConfig,
  withAndroidManifest,
  withAndroidStyles,
  withDangerousMod,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin tự động bảo toàn và cấu hình toàn bộ hạ tầng Native Phase 3
 * (OverlayService, OverlayChatActivity, TomoNativeModule, TomoReactPackage, BootReceiver, và assets)
 * mỗi khi chạy `npx expo prebuild`.
 */

const ensurePermission = (androidManifest, permissionName) => {
  const manifest = androidManifest.manifest;
  if (!manifest) return;
  if (!manifest['uses-permission']) {
    manifest['uses-permission'] = [];
  }
  const exists = manifest['uses-permission'].some(
    (p) => p && p.$ && p.$['android:name'] === permissionName,
  );
  if (!exists) {
    manifest['uses-permission'].push({
      $: { 'android:name': permissionName },
    });
  }
};

const deduplicatePermissions = (androidManifest) => {
  const manifest = androidManifest.manifest;
  if (!manifest || !manifest['uses-permission'] || !Array.isArray(manifest['uses-permission'])) {
    return;
  }
  const seen = new Set();
  manifest['uses-permission'] = manifest['uses-permission'].filter((p) => {
    const name = p?.$?.['android:name'];
    if (!name) return true;
    if (seen.has(name)) {
      return false;
    }
    seen.add(name);
    return true;
  });
};

const withOverlayManifest = (config) => {
  return withAndroidManifest(config, async (manifestConfig) => {
    const androidManifest = manifestConfig.modResults;
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);

    // Đảm bảo các quyền cần thiết không bị thiếu trong thẻ <manifest>
    ensurePermission(androidManifest, 'android.permission.SYSTEM_ALERT_WINDOW');
    ensurePermission(androidManifest, 'android.permission.RECEIVE_BOOT_COMPLETED');
    ensurePermission(androidManifest, 'android.permission.FOREGROUND_SERVICE');
    ensurePermission(androidManifest, 'android.permission.FOREGROUND_SERVICE_SPECIAL_USE');

    // Lọc trùng lặp toàn diện để đảm bảo Manifest luôn sạch sẽ và idempotent
    deduplicatePermissions(androidManifest);

    // Khai báo OverlayService
    if (!mainApplication.service) mainApplication.service = [];
    const hasOverlayService = mainApplication.service.some(
      (s) => s.$ && s.$['android:name'] === '.OverlayService',
    );
    if (!hasOverlayService) {
      mainApplication.service.push({
        $: {
          'android:name': '.OverlayService',
          'android:enabled': 'true',
          'android:exported': 'false',
          'android:foregroundServiceType': 'specialUse',
        },
        property: [
          {
            $: {
              'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
              'android:value': 'Hiển thị bong bóng nổi Tomo đồng hành trên màn hình',
            },
          },
        ],
      });
    }

    // Khai báo OverlayChatActivity trong một task độc lập (taskAffinity riêng)
    // để không kéo theo MainActivity lên màn hình khi mở chat nổi
    if (!mainApplication.activity) mainApplication.activity = [];
    const overlayActivity = mainApplication.activity.find(
      (a) => a.$ && a.$['android:name'] === '.OverlayChatActivity',
    );
    if (!overlayActivity) {
      mainApplication.activity.push({
        $: {
          'android:name': '.OverlayChatActivity',
          'android:taskAffinity': 'com.tomo.app.overlay',
          'android:excludeFromRecents': 'true',
          'android:configChanges':
            'keyboard|keyboardHidden|orientation|screenSize|screenLayout|uiMode|smallestScreenSize|assetsPaths',
          'android:exported': 'false',
          'android:launchMode': 'singleTop',
          'android:screenOrientation': 'portrait',
          'android:theme': '@style/Theme.App.Translucent',
          'android:windowSoftInputMode': 'adjustResize',
        },
      });
    } else {
      overlayActivity.$['android:taskAffinity'] = 'com.tomo.app.overlay';
      overlayActivity.$['android:excludeFromRecents'] = 'true';
    }

    // Khai báo BootReceiver
    if (!mainApplication.receiver) mainApplication.receiver = [];
    const hasBootReceiver = mainApplication.receiver.some(
      (r) => r.$ && r.$['android:name'] === '.BootReceiver',
    );
    if (!hasBootReceiver) {
      mainApplication.receiver.push({
        $: {
          'android:name': '.BootReceiver',
          'android:enabled': 'true',
          'android:exported': 'false',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.intent.action.BOOT_COMPLETED' } },
              { $: { 'android:name': 'android.intent.action.QUICKBOOT_POWERON' } },
            ],
          },
        ],
      });
    }

    return manifestConfig;
  });
};

const withOverlayStyles = (config) => {
  return withAndroidStyles(config, async (stylesConfig) => {
    const styles = stylesConfig.modResults;
    const resources = styles.resources;
    if (!resources.style) resources.style = [];

    const hasTranslucentStyle = resources.style.some(
      (s) => s.$ && s.$.name === 'Theme.App.Translucent',
    );
    if (!hasTranslucentStyle) {
      resources.style.push({
        $: {
          name: 'Theme.App.Translucent',
          parent: 'Theme.AppCompat.DayNight.NoActionBar',
        },
        item: [
          { $: { name: 'android:windowBackground' }, _: '@android:color/transparent' },
          { $: { name: 'android:colorBackground' }, _: '@android:color/transparent' },
          { $: { name: 'android:colorBackgroundCacheHint' }, _: '@null' },
          { $: { name: 'android:windowIsTranslucent' }, _: 'true' },
          { $: { name: 'android:windowNoTitle' }, _: 'true' },
          { $: { name: 'android:statusBarColor' }, _: '@android:color/transparent' },
          { $: { name: 'android:navigationBarColor' }, _: '@android:color/transparent' },
          { $: { name: 'android:windowAnimationStyle' }, _: '@android:style/Animation.Dialog' },
        ],
      });
    }

    return stylesConfig;
  });
};

const withOverlayNativeFiles = (config) => {
  return withDangerousMod(config, [
    'android',
    async (dangerousConfig) => {
      const projectRoot = dangerousConfig.modRequest.projectRoot;
      const androidRoot = dangerousConfig.modRequest.platformProjectRoot;

      const javaDir = path.join(androidRoot, 'app/src/main/java/com/tomo/app');
      const resDrawableDir = path.join(androidRoot, 'app/src/main/res/drawable');
      const nativeSrcJavaDir = path.join(projectRoot, 'native-src/android/java/com/tomo/app');
      const nativeSrcResDir = path.join(projectRoot, 'native-src/android/res/drawable');

      // Đảm bảo các thư mục đích tồn tại
      fs.mkdirSync(javaDir, { recursive: true });
      fs.mkdirSync(resDrawableDir, { recursive: true });

      // 1. Copy toàn bộ các file Kotlin
      const kotlinFiles = [
        'TomoNativeModule.kt',
        'TomoReactPackage.kt',
        'OverlayService.kt',
        'OverlayChatActivity.kt',
        'BootReceiver.kt',
      ];
      for (const file of kotlinFiles) {
        const srcPath = path.join(nativeSrcJavaDir, file);
        const destPath = path.join(javaDir, file);
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, destPath);
        }
      }

      // 2. Copy vector drawable asset của nhân vật Tomo
      const srcAvatar = path.join(nativeSrcResDir, 'tomo_chathead_avatar.xml');
      const destAvatar = path.join(resDrawableDir, 'tomo_chathead_avatar.xml');
      if (fs.existsSync(srcAvatar)) {
        fs.copyFileSync(srcAvatar, destAvatar);
      }

      // 3. Đăng ký TomoReactPackage vào MainApplication.kt
      const mainAppFile = path.join(javaDir, 'MainApplication.kt');
      if (fs.existsSync(mainAppFile)) {
        let content = fs.readFileSync(mainAppFile, 'utf8');
        if (!content.includes('TomoReactPackage()')) {
          content = content.replace(
            /PackageList\(this\)\.packages\.apply\s*\{([^}]*)\}/s,
            'PackageList(this).packages.apply {\n          add(TomoReactPackage())\n        }',
          );
          fs.writeFileSync(mainAppFile, content, 'utf8');
        }
      }

      return dangerousConfig;
    },
  ]);
};

module.exports = function withTomoOverlay(config) {
  config = withOverlayManifest(config);
  config = withOverlayStyles(config);
  config = withOverlayNativeFiles(config);
  return config;
};
