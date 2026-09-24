import { StyleSheet, Text, View } from 'react-native';

import { COLORS, SHADOWS } from '../constants/theme.js';

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
  row: { flexDirection: 'row', marginBottom: 12 },
  userRow: { justifyContent: 'flex-end' },
  tomoRow: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', borderRadius: 19, paddingHorizontal: 14, paddingVertical: 11 },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 6,
    ...SHADOWS.card,
  },
  tomoBubble: {
    backgroundColor: COLORS.paper,
    borderBottomLeftRadius: 6,
    borderColor: COLORS.border,
    borderWidth: 1,
    ...SHADOWS.card,
  },
  userText: { color: COLORS.white, fontSize: 15, lineHeight: 21 },
  tomoText: { color: COLORS.ink, fontSize: 15, lineHeight: 21 },
  timestamp: { marginTop: 5, fontSize: 10, opacity: 0.6 },
  retry: { color: COLORS.danger, fontWeight: '700', marginTop: 7 },
});
