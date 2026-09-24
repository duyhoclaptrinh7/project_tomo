import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import AppDock from '../components/AppDock.jsx';
import { COLORS, SHADOWS } from '../constants/theme.js';
import { useWellbeing } from '../hooks/useWellbeing.js';

const MOOD_LABELS = { tot: 'Ổn', met: 'Mệt', lo: 'Lo', te: 'Tệ' };

export default function ReflectionScreen({ navigation }) {
  const { reflection } = useWellbeing();

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => navigation?.goBack?.()}>
          <Text style={styles.back}>← Nhịp của bạn</Text>
        </Pressable>
        <Text style={styles.eyebrow}>NHÌN LẠI & GHI NHẬN</Text>
        <Text style={styles.title}>Tuần này không phải một bảng điểm</Text>
        <Text style={styles.intro}>
          Đây chỉ là những dấu vết cho thấy bạn đã cố gắng và chăm sóc mình ra sao.
        </Text>

        <View style={styles.praiseCard}>
          <Text style={styles.sparkle}>✦</Text>
          <Text style={styles.praise}>{reflection.praise}</Text>
        </View>

        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text style={styles.metricNumber}>{reflection.focusMinutes}</Text>
            <Text style={styles.metricLabel}>phút tập trung</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricNumber}>{reflection.selfCareCount}</Text>
            <Text style={styles.metricLabel}>lần chăm sóc mình</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricNumber}>{reflection.plannedMinutes}</Text>
            <Text style={styles.metricLabel}>phút được xếp vừa sức</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricNumber}>{reflection.balancedStreak}</Text>
            <Text style={styles.metricLabel}>ngày cân bằng học &amp; nghỉ</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nhịp cảm xúc 7 ngày</Text>
          {reflection.recentMoods.length ? (
            <View style={styles.moodLine}>
              {reflection.recentMoods.map((entry) => (
                <View key={entry.ts} style={styles.moodDot}>
                  <Text style={styles.moodLabel}>{MOOD_LABELS[entry.mood] ?? '—'}</Text>
                  <Text style={styles.moodDate}>{entry.ts.slice(5, 10)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.empty}>Chưa có check-in tuần này. Bạn không cần bù lại.</Text>
          )}
        </View>

        <View style={styles.reminder}>
          <Text style={styles.reminderTitle}>Một lời nhắc dịu dàng</Text>
          <Text style={styles.reminderText}>
            Chuỗi của Tomo chỉ có ý nghĩa khi có cả học và nghỉ. Một ngày bỏ lỡ không xóa những gì
            bạn đã làm được.
          </Text>
        </View>
      </ScrollView>
      <AppDock activeRoute="Dashboard" navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.canvas, flex: 1 },
  container: { flex: 1, backgroundColor: COLORS.canvas },
  content: { padding: 20, paddingTop: 40, paddingBottom: 48 },
  back: { color: COLORS.primary, fontWeight: '800', marginBottom: 22 },
  eyebrow: { color: COLORS.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: COLORS.ink, fontSize: 29, fontWeight: '900', lineHeight: 35, marginTop: 7 },
  intro: { color: COLORS.inkMuted, lineHeight: 21, marginTop: 8, marginBottom: 18 },
  praiseCard: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 24,
    padding: 21,
    ...SHADOWS.floating,
  },
  sparkle: { color: '#f2d39c', fontSize: 25 },
  praise: { color: '#fffaf2', fontSize: 18, fontWeight: '700', lineHeight: 27, marginTop: 10 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  metric: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    ...SHADOWS.card,
  },
  metricNumber: { color: '#8b5d40', fontSize: 22, fontWeight: '800' },
  metricLabel: { color: '#7a7069', fontSize: 11, lineHeight: 15, marginTop: 3 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 17,
    marginTop: 14,
    ...SHADOWS.card,
  },
  cardTitle: { color: '#3d332d', fontSize: 18, fontWeight: '800' },
  moodLine: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 },
  moodDot: {
    backgroundColor: '#f5e7d7',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  moodLabel: { color: '#754f39', fontWeight: '800' },
  moodDate: { color: '#9a7a67', fontSize: 10, marginTop: 2 },
  empty: { color: '#857970', marginTop: 10 },
  reminder: { borderLeftWidth: 3, borderLeftColor: '#d9aa73', paddingLeft: 13, marginTop: 18 },
  reminderTitle: { color: '#684d3d', fontWeight: '800' },
  reminderText: { color: '#7c6c61', lineHeight: 20, marginTop: 4 },
});
