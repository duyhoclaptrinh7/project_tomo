import { StyleSheet, Text, View } from 'react-native';

const LABELS = {
  idle: 'Tomo đang lắng nghe',
  happy: 'Tomo vui',
  comfort: 'Tomo ở bên bạn',
  focused: 'Tomo đang tập trung',
  speaking: 'Tomo đang nói',
  celebrating: 'Tomo ăn mừng',
};

/** Placeholder asset cho Phase 2; asset thật và cutscene thuộc Phase 6. */
export default function TomoAvatar({ animationState = 'idle' }) {
  return (
    <View style={styles.avatar}>
      <Text style={styles.face}>◕‿◕</Text>
      <Text style={styles.label}>{LABELS[animationState] ?? LABELS.idle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', padding: 8 },
  face: { fontSize: 28, color: '#6b5cff' },
  label: { marginTop: 2, fontSize: 12, color: '#555' },
});
