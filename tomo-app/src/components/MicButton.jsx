import { Pressable, StyleSheet, Text } from 'react-native';

export default function MicButton({ isRecording, disabled, onPressIn, onPressOut }) {
  const label = isRecording ? 'Đang ghi âm, thả để gửi' : 'Nhấn giữ để nói';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      testID="mic-button"
      style={({ pressed }) => [
        styles.button,
        isRecording && styles.recording,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={styles.icon}>{isRecording ? '●' : '🎤'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    borderColor: '#c4b5fd',
    borderRadius: 21,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    marginRight: 8,
    width: 42,
  },
  recording: { backgroundColor: '#fee2e2', borderColor: '#ef4444' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.45 },
  icon: { color: '#dc2626', fontSize: 18 },
});
