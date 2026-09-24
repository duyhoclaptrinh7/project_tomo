import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import * as Notifications from 'expo-notifications';

import TomoAvatar from '../components/TomoAvatar.jsx';
import { COLORS, RADII, SHADOWS } from '../constants/theme.js';
import {
  isOverlayPermissionGranted,
  openOverlaySettings,
} from '../services/native/overlayBridge.js';
import { appendFacts } from '../services/storage/memoryStorage.js';
import { useAppStore } from '../store/useAppStore.js';

const TOTAL_STEPS = 6;

/**
 * Màn hình Onboarding: Luồng thiết lập lần đầu nhiều bước quản lý bằng state nội bộ.
 * Toàn bộ hội thoại là scripted local (không gọi /chat).
 * Người dùng từ chối bất kỳ quyền nào vẫn tiếp tục sử dụng app.
 */
export default function OnboardingScreen({ navigation }) {
  const patchState = useAppStore((state) => state.patchState);
  const isMountedRef = useRef(true);

  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [tomoNickname, setTomoNickname] = useState('');
  const [permissionsStatus, setPermissionsStatus] = useState({
    microphone: null, // null | 'granted' | 'denied'
    overlay: null,
    notification: null,
  });
  const [hasOpenedOverlaySettings, setHasOpenedOverlaySettings] = useState(false);
  const [overlayFeedbackMsg, setOverlayFeedbackMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Lắng nghe khi app active trở lại (sau khi user từ Android Settings quay lại)
  useEffect(() => {
    async function checkOverlayOnResume() {
      try {
        const granted = await isOverlayPermissionGranted();
        if (isMountedRef.current) {
          if (granted) {
            setPermissionsStatus((prev) => ({ ...prev, overlay: 'granted' }));
            setOverlayFeedbackMsg('Đã phát hiện quyền được cấp thành công!');
          }
        }
      } catch (err) {
        console.warn('Lỗi khi kiểm tra overlay permission khi resume:', err);
      }
    }

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkOverlayOnResume();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Khi đến bước 6 (Tổng kết), re-check lại quyền thực tế một lần nữa để hiển thị chính xác
  useEffect(() => {
    if (step !== 6) return;

    let isEffectMounted = true;
    async function recheckAllPermissions() {
      try {
        const [overlayGranted, micRes, notifRes] = await Promise.all([
          isOverlayPermissionGranted().catch(() => false),
          getRecordingPermissionsAsync().catch(() => ({ granted: false })),
          Notifications.getPermissionsAsync().catch(() => ({ granted: false })),
        ]);

        if (isEffectMounted) {
          setPermissionsStatus((prev) => ({
            microphone: micRes?.granted ? 'granted' : prev.microphone || 'denied',
            overlay: overlayGranted ? 'granted' : prev.overlay || 'denied',
            notification: notifRes?.granted ? 'granted' : prev.notification || 'denied',
          }));
        }
      } catch (err) {
        console.warn('Lỗi khi re-check quyền ở bước tổng kết:', err);
      }
    }

    recheckAllPermissions();
    return () => {
      isEffectMounted = false;
    };
  }, [step]);

  // Bước 2: Lưu tên người dùng vào memory.md
  const handleSaveProfile = async () => {
    const trimmedUser = userName.trim();
    if (!trimmedUser) return;

    setIsProcessing(true);
    try {
      const facts = [`Tên người dùng: ${trimmedUser}`];
      if (tomoNickname.trim()) {
        facts.push(`Biệt danh của Tomo: ${tomoNickname.trim()}`);
      }
      await appendFacts(facts);
      setStep(3);
    } catch (err) {
      console.warn('Lỗi khi lưu thông tin vào memory:', err);
      // Tiếp tục bước tiếp theo dù lưu memory có lỗi nhẹ
      setStep(3);
    } finally {
      if (isMountedRef.current) {
        setIsProcessing(false);
      }
    }
  };

  // Bước 3: Xin quyền Microphone
  const handleRequestMicrophone = async () => {
    setIsProcessing(true);
    try {
      const response = await requestRecordingPermissionsAsync();
      const granted = Boolean(response?.granted);
      setPermissionsStatus((prev) => ({
        ...prev,
        microphone: granted ? 'granted' : 'denied',
      }));
    } catch {
      setPermissionsStatus((prev) => ({ ...prev, microphone: 'denied' }));
    } finally {
      if (isMountedRef.current) {
        setIsProcessing(false);
      }
      setStep(4);
    }
  };

  const handleSkipMicrophone = () => {
    setPermissionsStatus((prev) => ({ ...prev, microphone: 'denied' }));
    setStep(4);
  };

  // Bước 4: Xin quyền Overlay
  const handleRequestOverlay = async () => {
    setIsProcessing(true);
    setOverlayFeedbackMsg('');
    try {
      await openOverlaySettings();
      setHasOpenedOverlaySettings(true);
      // Kiểm tra trạng thái hiện tại (nếu người dùng đã có quyền sẵn)
      const granted = await isOverlayPermissionGranted();
      if (granted) {
        setPermissionsStatus((prev) => ({
          ...prev,
          overlay: 'granted',
        }));
        setStep(5);
      } else {
        setOverlayFeedbackMsg(
          'Đã mở Cài đặt. Sau khi gạt bật quyền cho Tomo, bạn hãy quay lại đây và nhấn "Kiểm tra lại quyền".',
        );
      }
    } catch {
      setPermissionsStatus((prev) => ({ ...prev, overlay: 'denied' }));
      setStep(5);
    } finally {
      if (isMountedRef.current) {
        setIsProcessing(false);
      }
    }
  };

  // Kiểm tra lại sau khi người dùng từ Settings quay lại
  const handleRecheckOverlay = async () => {
    setIsProcessing(true);
    try {
      const granted = await isOverlayPermissionGranted();
      if (granted) {
        setPermissionsStatus((prev) => ({ ...prev, overlay: 'granted' }));
        setStep(5);
      } else {
        setOverlayFeedbackMsg(
          'Chưa phát hiện quyền được bật. Vui lòng kiểm tra lại trong Cài đặt hệ thống, hoặc bấm "Để sau" để tiếp tục.',
        );
      }
    } catch (err) {
      console.warn('Lỗi khi kiểm tra lại quyền overlay:', err);
    } finally {
      if (isMountedRef.current) {
        setIsProcessing(false);
      }
    }
  };

  const handleSkipOverlay = () => {
    setPermissionsStatus((prev) => ({ ...prev, overlay: 'denied' }));
    setStep(5);
  };

  // Bước 5: Xin quyền Notification
  const handleRequestNotification = async () => {
    setIsProcessing(true);
    try {
      const response = await Notifications.requestPermissionsAsync();
      const granted = Boolean(response?.granted);
      setPermissionsStatus((prev) => ({
        ...prev,
        notification: granted ? 'granted' : 'denied',
      }));
    } catch {
      setPermissionsStatus((prev) => ({ ...prev, notification: 'denied' }));
    } finally {
      if (isMountedRef.current) {
        setIsProcessing(false);
      }
      setStep(6);
    }
  };

  const handleSkipNotification = () => {
    setPermissionsStatus((prev) => ({ ...prev, notification: 'denied' }));
    setStep(6);
  };

  // Bước 6: Hoàn tất Onboarding
  const handleFinishOnboarding = async () => {
    setIsProcessing(true);
    try {
      await patchState({ onboarded: true });
      if (navigation && typeof navigation.reset === 'function') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Chat', params: { isOverlay: false } }],
        });
      } else if (navigation && typeof navigation.replace === 'function') {
        navigation.replace('Chat', { isOverlay: false });
      }
    } catch (err) {
      console.warn('Lỗi khi cập nhật onboarded flag:', err);
    } finally {
      if (isMountedRef.current) {
        setIsProcessing(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.topIndicator}>
        <Text style={styles.stepText}>
          Bước {step}/{TOTAL_STEPS}
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Bước 1: Chào mừng */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <TomoAvatar animationState="happy" size="large" />
            <Text style={styles.title}>Chào bạn, tớ là Tomo!</Text>
            <Text style={styles.description}>
              Tomo là người bạn đồng hành AI sống cùng bạn trên điện thoại, sẵn sàng lắng nghe chia
              sẻ, an ủi khi mệt mỏi và đồng hành cùng bạn mỗi ngày.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setStep(2)}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>Làm quen với Tomo</Text>
            </Pressable>
          </View>
        )}

        {/* Bước 2: Hỏi tên người dùng */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.avatarPlaceholder}>✨</Text>
            <Text style={styles.title}>Tớ nên gọi bạn là gì?</Text>
            <Text style={styles.description}>
              Hãy cho Tomo biết tên hoặc biệt danh của bạn để chúng mình dễ xưng hô nhé.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tên của bạn (*)</Text>
              <TextInput
                value={userName}
                onChangeText={setUserName}
                placeholder="Ví dụ: Duy, An, Minh..."
                style={styles.textInput}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Biệt danh bạn muốn đặt cho Tomo (tùy chọn)</Text>
              <TextInput
                value={tomoNickname}
                onChangeText={setTomoNickname}
                placeholder="Mặc định: Tomo"
                style={styles.textInput}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={!userName.trim() || isProcessing}
              onPress={handleSaveProfile}
              style={({ pressed }) => [
                styles.primaryButton,
                (!userName.trim() || isProcessing) && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              {isProcessing ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Tiếp tục</Text>
              )}
            </Pressable>
          </View>
        )}

        {/* Bước 3: Quyền Microphone */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.avatarPlaceholder}>🎙️</Text>
            <Text style={styles.title}>Quyền Microphone</Text>
            <Text style={styles.description}>
              Tomo cần quyền Microphone để bạn có thể nhấn-giữ nói chuyện bằng giọng nói thay vì chỉ
              gõ phím.
            </Text>
            <View style={styles.tipBox}>
              <Text style={styles.tipText}>
                💡 Bạn vẫn có thể nhắn tin bằng văn bản nếu từ chối quyền này.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={isProcessing}
              onPress={handleRequestMicrophone}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>Cấp quyền Microphone</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={handleSkipMicrophone}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryButtonText}>Để sau</Text>
            </Pressable>
          </View>
        )}

        {/* Bước 4: Quyền Overlay */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.avatarPlaceholder}>🫧</Text>
            <Text style={styles.title}>Quyền hiển thị trên ứng dụng khác</Text>
            <Text style={styles.description}>
              Để Tomo có thể xuất hiện dạng bong bóng nổi (chat-head) trên màn hình khi bạn đang
              lướt web hay xem phim.
            </Text>
            <View style={styles.tipBox}>
              <Text style={styles.tipText}>
                ⚙️ Nút bên dưới sẽ mở màn hình Cài đặt hệ thống để bạn gạt bật quyền cho Tomo.
              </Text>
            </View>

            {Boolean(overlayFeedbackMsg) && (
              <View
                style={[
                  styles.feedbackBox,
                  permissionsStatus.overlay === 'granted'
                    ? styles.feedbackSuccess
                    : styles.feedbackWarning,
                ]}
              >
                <Text
                  style={[
                    styles.feedbackText,
                    permissionsStatus.overlay === 'granted'
                      ? styles.feedbackSuccessText
                      : styles.feedbackWarningText,
                  ]}
                >
                  {overlayFeedbackMsg}
                </Text>
              </View>
            )}

            {permissionsStatus.overlay === 'granted' ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setStep(5)}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              >
                <Text style={styles.primaryButtonText}>Đã cấp quyền — Tiếp tục</Text>
              </Pressable>
            ) : hasOpenedOverlaySettings ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  disabled={isProcessing}
                  onPress={handleRecheckOverlay}
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                >
                  {isProcessing ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Kiểm tra lại quyền</Text>
                  )}
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  disabled={isProcessing}
                  onPress={handleRequestOverlay}
                  style={({ pressed }) => [styles.reopenButton, pressed && styles.pressed]}
                >
                  <Text style={styles.reopenButtonText}>Mở lại Cài đặt</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                accessibilityRole="button"
                disabled={isProcessing}
                onPress={handleRequestOverlay}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              >
                {isProcessing ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>Mở Cài đặt cấp quyền</Text>
                )}
              </Pressable>
            )}

            <Pressable
              accessibilityRole="button"
              onPress={handleSkipOverlay}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryButtonText}>Để sau</Text>
            </Pressable>
          </View>
        )}

        {/* Bước 5: Quyền Notification */}
        {step === 5 && (
          <View style={styles.stepContainer}>
            <Text style={styles.avatarPlaceholder}>🔔</Text>
            <Text style={styles.title}>Quyền Thông báo</Text>
            <Text style={styles.description}>
              Để Tomo có thể gửi lời hỏi thăm, đồng hành cùng bạn và gửi thông báo nhắc nhở nhẹ
              nhàng.
            </Text>

            <Pressable
              accessibilityRole="button"
              disabled={isProcessing}
              onPress={handleRequestNotification}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>Cấp quyền Thông báo</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={handleSkipNotification}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryButtonText}>Để sau</Text>
            </Pressable>
          </View>
        )}

        {/* Bước 6: Tổng kết & Hoàn tất */}
        {step === 6 && (
          <View style={styles.stepContainer}>
            <TomoAvatar animationState="celebrating" size="large" />
            <Text style={styles.title}>Sẵn sàng đồng hành cùng {userName}!</Text>
            <Text style={styles.description}>
              Dưới đây là các quyền bạn đã thiết lập (bạn có thể thay đổi bất kỳ lúc nào trong Cài
              đặt):
            </Text>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Microphone:</Text>
                <Text
                  style={[
                    styles.summaryStatus,
                    permissionsStatus.microphone === 'granted' ? styles.granted : styles.denied,
                  ]}
                >
                  {permissionsStatus.microphone === 'granted' ? 'Đã cấp' : 'Chưa cấp'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Bong bóng nổi (Overlay):</Text>
                <Text
                  style={[
                    styles.summaryStatus,
                    permissionsStatus.overlay === 'granted' ? styles.granted : styles.denied,
                  ]}
                >
                  {permissionsStatus.overlay === 'granted' ? 'Đã cấp' : 'Chưa cấp'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Thông báo:</Text>
                <Text
                  style={[
                    styles.summaryStatus,
                    permissionsStatus.notification === 'granted' ? styles.granted : styles.denied,
                  ]}
                >
                  {permissionsStatus.notification === 'granted' ? 'Đã cấp' : 'Chưa cấp'}
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={isProcessing}
              onPress={handleFinishOnboarding}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              {isProcessing ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Bắt đầu trò chuyện</Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
    paddingTop: 44,
  },
  topIndicator: {
    paddingHorizontal: 24,
    marginBottom: 18,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  progressBar: {
    height: 7,
    backgroundColor: COLORS.paperDeep,
    borderRadius: RADII.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: RADII.pill,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  stepContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 32,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 28,
    ...SHADOWS.card,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 38,
    fontSize: 38,
    marginBottom: 20,
    overflow: 'hidden',
    padding: 15,
  },
  title: {
    fontSize: 25,
    fontFamily: 'serif',
    fontWeight: '900',
    color: COLORS.ink,
    lineHeight: 31,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: COLORS.inkMuted,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 26,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 6,
  },
  textInput: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: COLORS.paper,
    color: COLORS.ink,
  },
  tipBox: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 14,
    padding: 12,
    marginBottom: 24,
    width: '100%',
  },
  tipText: {
    fontSize: 13,
    color: COLORS.primaryDark,
    lineHeight: 18,
  },
  primaryButton: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.inkMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  summaryCard: {
    width: '100%',
    backgroundColor: COLORS.paper,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.ink,
  },
  summaryStatus: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  granted: {
    backgroundColor: COLORS.primarySoft,
    color: COLORS.primary,
  },
  denied: {
    backgroundColor: COLORS.pinkSoft,
    color: COLORS.danger,
  },
  disabled: {
    backgroundColor: COLORS.paperDeep,
  },
  pressed: {
    opacity: 0.8,
  },
  feedbackBox: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    width: '100%',
    borderWidth: 1,
  },
  feedbackWarning: {
    backgroundColor: COLORS.peachSoft,
    borderColor: COLORS.peach,
  },
  feedbackSuccess: {
    backgroundColor: COLORS.lavenderSoft,
    borderColor: COLORS.lavender,
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 18,
  },
  feedbackWarningText: {
    color: COLORS.brown,
  },
  feedbackSuccessText: {
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  reopenButton: {
    width: '100%',
    height: 40,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  reopenButtonText: {
    color: COLORS.ink,
    fontSize: 14,
    fontWeight: '600',
  },
});
