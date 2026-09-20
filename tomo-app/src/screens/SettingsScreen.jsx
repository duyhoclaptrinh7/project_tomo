import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { getRecordingPermissionsAsync } from 'expo-audio';
import * as Notifications from 'expo-notifications';

import {
  isOverlayPermissionGranted,
  openBatteryOptimizationSettings,
  openOverlaySettings,
  startOverlay,
  stopOverlay,
} from '../services/native/overlayBridge.js';
import { useAppStore } from '../store/useAppStore.js';

/**
 * Màn hình Cài đặt: Quản lý overlay, kiểm tra và hướng dẫn cấp quyền hệ thống.
 */
export default function SettingsScreen({ navigation }) {
  const isOverlayEnabled = useAppStore((state) => state.isOverlayEnabled);
  const patchState = useAppStore((state) => state.patchState);

  const [overlayGranted, setOverlayGranted] = useState(false);
  const [micGranted, setMicGranted] = useState(false);
  const [notificationGranted, setNotificationGranted] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(false);
  const [isTogglingOverlay, setIsTogglingOverlay] = useState(false);

  const handleManualRefresh = async () => {
    setCheckingPermissions(true);
    try {
      const overlayStatus = await isOverlayPermissionGranted();
      setOverlayGranted(Boolean(overlayStatus));

      try {
        const micResponse = await getRecordingPermissionsAsync();
        setMicGranted(Boolean(micResponse?.granted));
      } catch {
        setMicGranted(false);
      }

      try {
        const notifResponse = await Notifications.getPermissionsAsync();
        setNotificationGranted(Boolean(notifResponse?.granted));
      } catch {
        setNotificationGranted(false);
      }
    } catch (err) {
      console.warn('Lỗi khi kiểm tra quyền:', err);
    } finally {
      setCheckingPermissions(false);
    }
  };

  // Kiểm tra quyền khi vào màn hình và khi app resume sau khi người dùng vào Android Settings
  useEffect(() => {
    let isMounted = true;
    async function checkCurrentPermissions() {
      try {
        const overlayStatus = await isOverlayPermissionGranted();
        if (isMounted) {
          setOverlayGranted(Boolean(overlayStatus));
        }

        try {
          const micResponse = await getRecordingPermissionsAsync();
          if (isMounted) {
            setMicGranted(Boolean(micResponse?.granted));
          }
        } catch {
          if (isMounted) {
            setMicGranted(false);
          }
        }

        try {
          const notifResponse = await Notifications.getPermissionsAsync();
          if (isMounted) {
            setNotificationGranted(Boolean(notifResponse?.granted));
          }
        } catch {
          if (isMounted) {
            setNotificationGranted(false);
          }
        }
      } catch (err) {
        console.warn('Lỗi khi kiểm tra quyền:', err);
      }
    }

    checkCurrentPermissions();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkCurrentPermissions();
      }
    });
    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  const handleToggleOverlay = async (targetValue) => {
    if (isTogglingOverlay) return;
    setIsTogglingOverlay(true);

    try {
      if (targetValue) {
        // Kiểm tra quyền trước khi bật
        const hasPermission = await isOverlayPermissionGranted();
        if (!hasPermission) {
          Alert.alert(
            'Cần quyền hiển thị',
            'Tomo cần quyền "Hiển thị trên các ứng dụng khác" để xuất hiện dạng chat-head. Vui lòng bật quyền này trong Cài đặt.',
            [
              { text: 'Để sau', style: 'cancel' },
              {
                text: 'Mở Cài đặt',
                onPress: async () => {
                  await openOverlaySettings();
                },
              },
            ],
          );
          await patchState({ isOverlayEnabled: false });
          return;
        }

        const started = await startOverlay();
        if (started) {
          await patchState({ isOverlayEnabled: true });
        } else {
          Alert.alert('Không thể bật overlay', 'Không thể khởi động dịch vụ overlay lúc này.');
          await patchState({ isOverlayEnabled: false });
        }
      } else {
        await stopOverlay();
        await patchState({ isOverlayEnabled: false });
      }
    } catch (err) {
      console.warn('Lỗi khi chuyển đổi trạng thái overlay:', err);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi thao tác overlay.');
    } finally {
      setIsTogglingOverlay(false);
    }
  };

  const handleOpenOverlaySettings = async () => {
    await openOverlaySettings();
  };

  const handleOpenBatterySettings = async () => {
    const opened = await openBatteryOptimizationSettings();
    if (!opened) {
      Alert.alert(
        'Chỉ có trên bản Android đầy đủ',
        'Hãy chạy development build/APK để mở cài đặt tối ưu pin.',
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation?.goBack?.()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backButtonText}>← Quay lại</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Cài đặt</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Nhóm Cài đặt Overlay */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hiện diện của Tomo</Text>
          <View style={styles.row}>
            <View style={styles.rowTextContainer}>
              <Text style={styles.settingLabel}>Bong bóng nổi (Overlay)</Text>
              <Text style={styles.settingDescription}>
                Tomo xuất hiện trên các ứng dụng khác để bạn có thể trò chuyện mọi lúc.
              </Text>
            </View>
            <Switch
              testID="overlay-switch"
              accessibilityLabel="Bong bóng nổi (Overlay)"
              value={Boolean(isOverlayEnabled)}
              onValueChange={handleToggleOverlay}
              disabled={isTogglingOverlay}
              trackColor={{ false: '#ddd', true: '#6b5cff' }}
              thumbColor="#fff"
            />
          </View>
          {!overlayGranted && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Chưa cấp quyền "Hiển thị trên ứng dụng khác".
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={handleOpenOverlaySettings}
                style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
              >
                <Text style={styles.linkButtonText}>Mở Cài đặt hệ thống để cấp quyền</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Focus mode chạy nền</Text>
          <Text style={styles.settingDescription}>
            Một số máy Xiaomi, Oppo, Vivo hoặc Samsung có thể tự dừng phiên focus. Bạn có thể cho
            phép Tomo chạy nền trong phần tối ưu pin của Android.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={handleOpenBatterySettings}
            style={({ pressed }) => [styles.batteryButton, pressed && styles.pressed]}
          >
            <Text style={styles.batteryButtonText}>Mở cài đặt tối ưu pin</Text>
          </Pressable>
        </View>

        {/* Nhóm Trạng thái quyền */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Trạng thái quyền hệ thống</Text>
            <Pressable
              accessibilityRole="button"
              disabled={checkingPermissions}
              onPress={handleManualRefresh}
              style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}
            >
              {checkingPermissions ? (
                <ActivityIndicator size="small" color="#6b5cff" />
              ) : (
                <Text style={styles.refreshButtonText}>Kiểm tra lại</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.permissionItem}>
            <Text style={styles.permissionName}>Quyền hiển thị trên ứng dụng khác (Overlay)</Text>
            <Text style={[styles.permissionBadge, overlayGranted ? styles.granted : styles.denied]}>
              {overlayGranted ? 'Đã cấp' : 'Chưa cấp'}
            </Text>
          </View>

          <View style={styles.permissionItem}>
            <Text style={styles.permissionName}>Quyền Microphone (Ghi âm giọng nói)</Text>
            <Text style={[styles.permissionBadge, micGranted ? styles.granted : styles.denied]}>
              {micGranted ? 'Đã cấp' : 'Chưa cấp'}
            </Text>
          </View>

          <View style={styles.permissionItem}>
            <Text style={styles.permissionName}>Quyền Thông báo (Nhắc nhở)</Text>
            <Text
              style={[styles.permissionBadge, notificationGranted ? styles.granted : styles.denied]}
            >
              {notificationGranted ? 'Đã cấp' : 'Chưa cấp'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fbfbff',
    paddingTop: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#f0f0f5',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    lineHeight: 18,
  },
  warningBox: {
    marginTop: 12,
    backgroundColor: '#fff7e6',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ffe58f',
  },
  warningText: {
    fontSize: 12,
    color: '#d46b08',
    marginBottom: 6,
  },
  linkButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffe58f',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  linkButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#873800',
  },
  batteryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#ede9fe',
    borderRadius: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  batteryButtonText: { color: '#5b21b6', fontSize: 13, fontWeight: '700' },
  refreshButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f0f0ff',
    borderRadius: 6,
  },
  refreshButtonText: {
    fontSize: 12,
    color: '#6b5cff',
    fontWeight: '600',
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  permissionName: {
    fontSize: 13,
    color: '#444',
    flex: 1,
    paddingRight: 8,
  },
  permissionBadge: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  granted: {
    backgroundColor: '#e6f7ff',
    color: '#0958d9',
  },
  denied: {
    backgroundColor: '#fff1f0',
    color: '#cf1322',
  },
  pressed: {
    opacity: 0.7,
  },
});
