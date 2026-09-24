import { Pressable, StyleSheet, Text } from 'react-native';

import { COLORS } from '../constants/theme.js';

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
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.lavender,
    borderRadius: 16,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    marginRight: 8,
    width: 42,
  },
  recording: { backgroundColor: COLORS.pinkSoft, borderColor: COLORS.danger },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.45 },
  icon: { color: COLORS.primary, fontSize: 17 },
});
