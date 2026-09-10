import { StyleSheet, Text, View } from 'react-native';

/** Bubble dumb: mọi logic request/retry nằm trong useChat và ChatScreen. */
export default function ChatBubble({ role, text, timestamp, failed = false, onRetry }) {
  const isUser = role === 'user';
  return (
    <View style={[styles.row, isUser ? styles.userRow : styles.tomoRow]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.tomoBubble]}>
        <Text style={isUser ? styles.userText : styles.tomoText}>{text}</Text>
        {timestamp ? <Text style={styles.timestamp}>{timestamp}</Text> : null}
        {failed ? (
          <Text onPress={onRetry} style={styles.retry}>
            Gửi lại
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: 10 },
  userRow: { justifyContent: 'flex-end' },
  tomoRow: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: 18, padding: 12 },
  userBubble: { backgroundColor: '#6b5cff' },
  tomoBubble: { backgroundColor: '#eef0ff' },
  userText: { color: '#fff', fontSize: 16 },
  tomoText: { color: '#1d1f33', fontSize: 16 },
  timestamp: { marginTop: 4, fontSize: 11, opacity: 0.65 },
  retry: { color: '#a33', fontWeight: '600', marginTop: 6 },
});
