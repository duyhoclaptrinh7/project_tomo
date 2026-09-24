import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, SHADOWS } from '../constants/theme.js';

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
    backgroundColor: COLORS.paper,
    borderColor: COLORS.peach,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 14,
    marginBottom: 10,
    padding: 12,
    ...SHADOWS.card,
  },
  title: { color: COLORS.ink, fontSize: 15, fontWeight: '700' },
  detail: { color: COLORS.inkMuted, marginTop: 4 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 8 },
  cancelButton: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8 },
  cancelText: { color: COLORS.brown, fontWeight: '600' },
  confirmButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  confirmText: { color: COLORS.white, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
