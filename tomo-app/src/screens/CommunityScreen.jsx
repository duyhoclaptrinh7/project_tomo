import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import AppDock from '../components/AppDock.jsx';
import { COLORS, SHADOWS } from '../constants/theme.js';
import { useAppStore } from '../store/useAppStore.js';

function formatElapsed(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function CommunityScreen({ navigation }) {
  const sessions = useAppStore((state) => state.coworkingSessions);
  const encouragementCount = useAppStore((state) => state.encouragementCount);
  const recordSession = useAppStore((state) => state.recordCoworkingSession);
  const sendEncouragement = useAppStore((state) => state.sendEncouragement);
  const [subject, setSubject] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!isActive) return undefined;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [isActive]);

  const handleToggle = async () => {
    if (!isActive) {
      setSeconds(0);
      setIsActive(true);
      setNotice('Bạn đã vào phòng ẩn danh. Không camera, không bảng xếp hạng.');
      return;
    }
    setIsActive(false);
    await recordSession({ subject, minutes: Math.max(1, Math.round(seconds / 60)) });
    setNotice('Phiên đồng hành đã được ghi nhận. Cảm ơn vì bạn đã hiện diện.');
  };

  const handleEncouragement = async () => {
    await sendEncouragement();
    setNotice('💛 Một lời động viên không kèm danh tính đã được ghi nhận.');
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => navigation?.goBack?.()}>
          <Text style={styles.back}>← Nhịp của bạn</Text>
        </Pressable>
        <Text style={styles.eyebrow}>ĐỒNG HÀNH XÃ HỘI</Text>
        <Text style={styles.title}>Tiếp sức lặng lẽ</Text>
        <Text style={styles.intro}>
          Một không gian không camera, không hồ sơ công khai và không thi đua. Bản hiện tại lưu
          phiên học trên máy; số người online sẽ chỉ xuất hiện khi có máy chủ realtime thật.
        </Text>

        <View style={styles.room}>
          <View style={styles.pulse}>
            <Text style={styles.pulseIcon}>{isActive ? '●' : '○'}</Text>
            <Text style={styles.pulseText}>
              {isActive ? 'Bạn đang hiện diện trong phòng' : 'Phòng đang chờ bạn'}
            </Text>
          </View>
          <Text style={styles.timer}>{formatElapsed(seconds)}</Text>
          <TextInput
            placeholder="Bạn đang học môn gì?"
            value={subject}
            onChangeText={setSubject}
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            onPress={handleToggle}
            style={[styles.primary, isActive && styles.stopButton]}
          >
            <Text style={styles.primaryText}>
              {isActive ? 'Kết thúc phiên học' : 'Vào phòng ẩn danh'}
            </Text>
          </Pressable>
          {isActive ? (
            <Pressable
              accessibilityRole="button"
              onPress={handleEncouragement}
              style={styles.heartButton}
            >
              <Text style={styles.heartText}>💛 Gửi một lời tiếp sức</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{sessions.length}</Text>
            <Text style={styles.statLabel}>phiên bạn đã hiện diện</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{encouragementCount}</Text>
            <Text style={styles.statLabel}>lời tiếp sức đã gửi</Text>
          </View>
        </View>

        <View style={styles.levelCard}>
          <Text style={styles.level}>CẤP ĐỘ 2</Text>
          <Text style={styles.levelTitle}>Nhóm bạn bè có danh tính</Text>
          <Text style={styles.levelText}>
            Chỉ mở khi có tài khoản, cơ chế đồng thuận và kiểm soát an toàn. Tomo không giả lập bạn
            bè hay tiến độ của người khác.
          </Text>
          <View style={styles.locked}>
            <Text style={styles.lockedText}>🔒 Chưa bật trong bản local-first</Text>
          </View>
        </View>
        {notice ? (
          <Text accessibilityLiveRegion="polite" style={styles.notice}>
            {notice}
          </Text>
        ) : null}
      </ScrollView>
      <AppDock activeRoute="Community" navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.canvas, flex: 1 },
  container: { flex: 1, backgroundColor: COLORS.canvas },
  content: { padding: 20, paddingTop: 40, paddingBottom: 48 },
  back: { color: COLORS.primary, fontWeight: '800', marginBottom: 22 },
  eyebrow: { color: COLORS.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  title: {
    color: COLORS.ink,
    fontFamily: 'serif',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 7,
  },
  intro: { color: COLORS.inkMuted, lineHeight: 21, marginTop: 8, marginBottom: 20 },
  room: { backgroundColor: COLORS.primaryDark, borderRadius: 24, padding: 20, ...SHADOWS.floating },
  pulse: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  pulseIcon: { color: COLORS.peach, fontSize: 16, marginRight: 8 },
  pulseText: { color: COLORS.lavenderSoft, fontWeight: '700' },
  timer: {
    color: COLORS.white,
    fontSize: 46,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: 22,
  },
  input: {
    backgroundColor: '#7D5A86',
    borderWidth: 1,
    borderColor: COLORS.lavender,
    borderRadius: 10,
    color: COLORS.white,
    padding: 12,
  },
  primary: {
    backgroundColor: COLORS.gold,
    borderRadius: 13,
    alignItems: 'center',
    paddingVertical: 13,
    marginTop: 12,
  },
  stopButton: { backgroundColor: COLORS.pink },
  primaryText: { color: COLORS.ink, fontWeight: '800' },
  heartButton: {
    borderWidth: 1,
    borderColor: COLORS.lavender,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 11,
    marginTop: 10,
  },
  heartText: { color: COLORS.white, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  stat: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
    ...SHADOWS.card,
  },
  statNumber: { color: COLORS.primaryDark, fontSize: 25, fontWeight: '800' },
  statLabel: { color: COLORS.inkMuted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  levelCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginTop: 14,
    ...SHADOWS.card,
  },
  level: { color: COLORS.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  levelTitle: { color: COLORS.ink, fontSize: 18, fontWeight: '800', marginTop: 6 },
  levelText: { color: COLORS.inkMuted, lineHeight: 20, marginTop: 6 },
  locked: { backgroundColor: COLORS.lavenderSoft, borderRadius: 10, padding: 10, marginTop: 12 },
  lockedText: { color: COLORS.primaryDark, fontWeight: '700', textAlign: 'center' },
  notice: { color: COLORS.inkMuted, textAlign: 'center', lineHeight: 19, marginTop: 14 },
});
