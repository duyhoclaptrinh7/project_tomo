import { Pressable, StyleSheet, Text, View } from 'react-native';

function describeAction(action) {
  if (action?.type === 'propose_schedule') {
    const date = new Date(action.params?.datetime_iso);
    const when = Number.isNaN(date.getTime())
      ? 'Thời gian chưa hợp lệ'
      : date.toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });
    const kind = action.params?.type === 'alarm' ? 'Báo thức' : 'Sự kiện lịch';
    return {
      title: `${kind}: ${action.params?.title ?? 'Không có tiêu đề'}`,
      detail: when,
      confirmLabel: 'Mở app hệ thống',
    };
  }

  const duration = action?.params?.duration_minutes;
  return {
    title: 'Bắt đầu phiên focus?',
    detail: Number.isFinite(duration) ? `Thời lượng dự kiến: ${duration} phút` : 'Không giới hạn',
    confirmLabel: 'Bắt đầu',
  };
}

/** Thẻ xác nhận dumb cho các action ảnh hưởng tới hệ thống hoặc foreground service. */
export default function ActionConfirmationCard({ action, disabled, onConfirm, onCancel }) {
  if (!action) return null;
  const content = describeAction(action);

  return (
    <View accessibilityLabel="Xác nhận hành động" style={styles.card}>
      <Text style={styles.title}>{content.title}</Text>
      <Text style={styles.detail}>{content.detail}</Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={onCancel}
          style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
        >
          <Text style={styles.cancelText}>Hủy</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={onConfirm}
          style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}
        >
          <Text style={styles.confirmText}>{disabled ? 'Đang mở...' : content.confirmLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff8dc',
    borderColor: '#e4c95f',
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 14,
    marginBottom: 10,
    padding: 12,
  },
  title: { color: '#342d13', fontSize: 15, fontWeight: '700' },
  detail: { color: '#63572a', marginTop: 4 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 8 },
  cancelButton: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8 },
  cancelText: { color: '#665d3a', fontWeight: '600' },
  confirmButton: {
    backgroundColor: '#6b5cff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  confirmText: { color: '#fff', fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
