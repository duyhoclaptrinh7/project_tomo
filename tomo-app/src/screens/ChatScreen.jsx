import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import ChatBubble from '../components/ChatBubble.jsx';
import ActionConfirmationCard from '../components/ActionConfirmationCard.jsx';
import MicButton from '../components/MicButton.jsx';
import TomoAvatar from '../components/TomoAvatar.jsx';
import { COLORS, RADII, SHADOWS } from '../constants/theme.js';
import { useChat } from '../hooks/useChat.js';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder.js';
import { useAppStore } from '../store/useAppStore.js';

/**
 * Màn chat chính của Tomo.
 * Hỗ trợ chạy trong cả Activity chính và Activity nổi (OverlayChatActivity).
 */
export default function ChatScreen({ navigation, route }) {
  const isOverlay = Boolean(route?.params?.isOverlay);
  const onboarded = useAppStore((state) => state.onboarded);
  const evolutionStage = useAppStore((state) => state.evolutionStage);
  const equippedCosmetic = useAppStore((state) => state.equippedCosmetic);
  const [draft, setDraft] = useState('');

  // Bảo vệ: Nếu chưa hoàn tất onboarding thì tự động quay về Onboarding
  useEffect(() => {
    if (!onboarded) {
      if (navigation && typeof navigation.replace === 'function') {
        navigation.replace('Onboarding');
      }
    }
  }, [onboarded, navigation]);
  const {
    messages,
    loading,
    error,
    animationState,
    toast,
    pendingAction,
    isConfirmingAction,
    sendMessage,
    sendVoiceMessage,
    retryMessage,
    dismissToast,
    confirmPendingAction,
    dismissPendingAction,
    inspectLocalFiles,
  } = useChat();
  const { isRecording, error: voiceError, startRecording, stopRecording } = useVoiceRecorder();
  const listRef = useRef(null);
  const recordingStartRef = useRef(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(dismissToast, 2200);
      return () => clearTimeout(timer);
    }
  }, [dismissToast, toast]);

  const handleSend = useCallback(async () => {
    const text = draft;
    setDraft('');
    await sendMessage(text);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }, [draft, sendMessage]);

  const handleMicPressIn = useCallback(() => {
    recordingStartRef.current = startRecording();
  }, [startRecording]);

  const handleMicPressOut = useCallback(async () => {
    const started = await recordingStartRef.current;
    recordingStartRef.current = null;
    if (!started) return;

    const recording = await stopRecording();
    if (!recording) return;

    await sendVoiceMessage(recording);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }, [sendVoiceMessage, stopRecording]);

  const handleOpenSettings = () => {
    navigation?.navigate?.('Settings');
  };

  const handleOpenDashboard = () => {
    navigation?.navigate?.('Dashboard');
  };

  const handleCloseOverlay = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      BackHandler.exitApp();
    }
  };

  if (isOverlay) {
    return (
      <View style={styles.overlayRoot}>
        {/* Nền mờ bán trong suốt nhìn xuyên thấu ứng dụng bên dưới */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng chat nổi"
          testID="overlay-backdrop"
          style={styles.overlayBackdrop}
          onPress={handleCloseOverlay}
        />

        {/* Khung chat nổi Messenger dạng Floating Card */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.overlayCard}
        >
          {/* Header nổi với Avatar Tomo và Nút Đóng */}
          <View style={styles.overlayHeader}>
            <View style={styles.overlayHeaderSpacer} />
            <TomoAvatar
              animationState={animationState}
              stage={evolutionStage}
              cosmetic={equippedCosmetic}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng"
              onPress={handleCloseOverlay}
              style={({ pressed }) => [styles.overlayCloseButton, pressed && styles.pressed]}
            >
              <Text style={styles.overlayCloseButtonText}>✕ Đóng</Text>
            </Pressable>
          </View>

          {/* Danh sách tin nhắn */}
          <FlatList
            ref={listRef}
            style={styles.listContainer}
            contentContainerStyle={styles.overlayList}
            keyboardShouldPersistTaps="handled"
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatBubble
                role={item.role}
                text={item.text}
                timestamp={new Date(item.ts).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                failed={item.status === 'failed'}
                onRetry={() => retryMessage(item.id)}
              />
            )}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {voiceError ? <Text style={styles.error}>{voiceError}</Text> : null}
          {toast ? (
            <View style={styles.toast}>
              <Text style={styles.toastText}>{toast}</Text>
            </View>
          ) : null}
          <ActionConfirmationCard
            action={pendingAction}
            disabled={isConfirmingAction}
            onCancel={dismissPendingAction}
            onConfirm={confirmPendingAction}
          />

          {/* Khung nhập tin nhắn */}
          <View style={styles.composer}>
            <TextInput
              accessibilityLabel="Nhập tin nhắn"
              value={draft}
              onChangeText={setDraft}
              onFocus={() =>
                setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150)
              }
              multiline
              placeholder="Nhắn cho Tomo..."
              style={styles.input}
            />
            <MicButton
              disabled={loading}
              isRecording={isRecording}
              onPressIn={handleMicPressIn}
              onPressOut={handleMicPressOut}
            />
            <Pressable
              accessibilityRole="button"
              disabled={!draft.trim() || loading}
              onPress={handleSend}
              style={({ pressed }) => [
                styles.sendButton,
                pressed && styles.pressed,
                (!draft.trim() || loading) && styles.disabled,
              ]}
            >
              <Text style={styles.sendText}>{loading ? '...' : 'Gửi'}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.headerLeftGroup}>
          <Pressable
            accessibilityRole="button"
            onPress={handleOpenDashboard}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          >
            <Text style={styles.headerButtonText}>☀️ Nhịp</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={handleOpenSettings}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          >
            <Text style={styles.headerButtonText}>⚙️ Cài đặt</Text>
          </Pressable>
        </View>

        <TomoAvatar
          animationState={animationState}
          stage={evolutionStage}
          cosmetic={equippedCosmetic}
        />

        <Pressable
          accessibilityRole="button"
          onPress={inspectLocalFiles}
          style={({ pressed }) => [styles.inspectButton, pressed && styles.pressed]}
        >
          <Text style={styles.inspectButtonText}>📁 In file</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        style={styles.listContainer}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatBubble
            role={item.role}
            text={item.text}
            timestamp={new Date(item.ts).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
            failed={item.status === 'failed'}
            onRetry={() => retryMessage(item.id)}
          />
        )}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {voiceError ? <Text style={styles.error}>{voiceError}</Text> : null}
      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
      <ActionConfirmationCard
        action={pendingAction}
        disabled={isConfirmingAction}
        onCancel={dismissPendingAction}
        onConfirm={confirmPendingAction}
      />

      <View style={styles.composer}>
        <TextInput
          accessibilityLabel="Nhập tin nhắn"
          value={draft}
          onChangeText={setDraft}
          onFocus={() => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150)}
          multiline
          placeholder="Nhắn cho Tomo..."
          style={styles.input}
        />
        <MicButton
          disabled={loading}
          isRecording={isRecording}
          onPressIn={handleMicPressIn}
          onPressOut={handleMicPressOut}
        />
        <Pressable
          accessibilityRole="button"
          disabled={!draft.trim() || loading}
          onPress={handleSend}
          style={({ pressed }) => [
            styles.sendButton,
            pressed && styles.pressed,
            (!draft.trim() || loading) && styles.disabled,
          ]}
        >
          <Text style={styles.sendText}>{loading ? '...' : 'Gửi'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
    paddingTop: 32,
  },
  overlayRoot: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 24,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(77, 53, 69, 0.48)',
  },
  overlayCard: {
    width: '94%',
    height: '82%',
    backgroundColor: 'rgba(255, 252, 250, 0.98)',
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 16,
    shadowColor: '#4D3545',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(168, 120, 181, 0.30)',
  },
  overlayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  overlayHeaderSpacer: {
    width: 60,
  },
  overlayCloseButton: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADII.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.lavender,
  },
  overlayCloseButtonText: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  overlayList: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  listContainer: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 12 },
  error: { color: COLORS.danger, marginHorizontal: 16, marginBottom: 8 },
  toast: {
    alignSelf: 'center',
    backgroundColor: COLORS.primaryDark,
    borderRadius: 20,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  toastText: { color: COLORS.white, fontWeight: '600' },
  composer: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 22,
    borderTopWidth: 1,
    marginBottom: 12,
    marginHorizontal: 12,
    padding: 9,
    flexDirection: 'row',
    ...SHADOWS.floating,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 42,
    borderWidth: 1,
    backgroundColor: COLORS.paper,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    justifyContent: 'center',
    paddingHorizontal: 18,
    minHeight: 42,
  },
  pressed: { opacity: 0.8 },
  disabled: { backgroundColor: COLORS.paperDeep },
  sendText: { color: COLORS.white, fontWeight: '700' },
  header: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    justifyContent: 'center',
    position: 'relative',
    paddingBottom: 8,
    minHeight: 78,
  },
  headerLeftGroup: {
    position: 'absolute',
    left: 14,
    top: 20,
    flexDirection: 'row',
    gap: 6,
  },
  headerButton: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.lavender,
  },
  headerButtonText: {
    fontSize: 11,
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  inspectButton: {
    position: 'absolute',
    right: 14,
    top: 20,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inspectButtonText: {
    fontSize: 11,
    color: COLORS.ink,
    fontWeight: '600',
  },
});
