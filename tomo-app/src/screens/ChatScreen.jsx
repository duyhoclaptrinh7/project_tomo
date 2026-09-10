import { useCallback, useEffect, useRef, useState } from 'react';
import {
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
import TomoAvatar from '../components/TomoAvatar.jsx';
import { useChat } from '../hooks/useChat.js';

/** Màn chat text tối thiểu cho Phase 2. Không chứa voice, overlay hay navigation ngoài phạm vi. */
export default function ChatScreen() {
  const [draft, setDraft] = useState('');
  const {
    messages,
    loading,
    error,
    animationState,
    toast,
    sendMessage,
    retryMessage,
    dismissToast,
    inspectLocalFiles,
  } = useChat();
  const listRef = useRef(null);

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TomoAvatar animationState={animationState} />
        <Pressable
          accessibilityRole="button"
          onPress={inspectLocalFiles}
          style={({ pressed }) => [styles.inspectButton, pressed && styles.pressed]}
        >
          <Text style={styles.inspectButtonText}>📁 In file local</Text>
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
      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
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
  container: { flex: 1, backgroundColor: '#fbfbff', paddingTop: 28 },
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
