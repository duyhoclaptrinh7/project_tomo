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
            <TomoAvatar animationState={animationState} />
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
        <Pressable
          accessibilityRole="button"
          onPress={handleOpenSettings}
          style={({ pressed }) => [styles.headerLeftButton, pressed && styles.pressed]}
        >
          <Text style={styles.headerButtonText}>⚙️ Cài đặt</Text>
        </Pressable>

        <TomoAvatar animationState={animationState} />

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
    backgroundColor: '#fbfbff',
    paddingTop: 28,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayCard: {
    width: '94%',
    height: '82%',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(107, 92, 255, 0.25)',
  },
  overlayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f6f5ff',
    borderBottomWidth: 1,
    borderBottomColor: '#ebe8ff',
  },
  overlayHeaderSpacer: {
    width: 60,
  },
  overlayCloseButton: {
    backgroundColor: '#ede9fe',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  overlayCloseButtonText: {
    fontSize: 12,
    color: '#5b21b6',
    fontWeight: '700',
  },
  overlayList: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  listContainer: { flex: 1 },
  list: { paddingHorizontal: 14, paddingBottom: 12 },
  error: { color: '#a33', marginHorizontal: 16, marginBottom: 8 },
  toast: {
    alignSelf: 'center',
    backgroundColor: '#2225',
    borderRadius: 20,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  toastText: { color: '#fff', fontWeight: '600' },
  composer: {
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    flexDirection: 'row',
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 42,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#6b5cff',
    borderRadius: 20,
    justifyContent: 'center',
    paddingHorizontal: 18,
    minHeight: 42,
  },
  pressed: { opacity: 0.8 },
  disabled: { backgroundColor: '#aaa' },
  sendText: { color: '#fff', fontWeight: '700' },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingBottom: 4,
    minHeight: 52,
  },
  headerLeftButton: {
    position: 'absolute',
    left: 14,
    top: 10,
    backgroundColor: '#eee',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  headerButtonText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '600',
  },
  inspectButton: {
    position: 'absolute',
    right: 14,
    top: 10,
    backgroundColor: '#eee',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  inspectButtonText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '600',
  },
});
