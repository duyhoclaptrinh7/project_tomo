import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import AppDock from '../components/AppDock.jsx';
import TomoAvatar from '../components/TomoAvatar.jsx';
import { COLORS, RADII, SHADOWS } from '../constants/theme.js';
import { useFocusTimer } from '../hooks/useFocusTimer.js';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder.js';
import { useWellbeing } from '../hooks/useWellbeing.js';
import { useAppStore } from '../store/useAppStore.js';

const MOODS = [
  { key: 'tot', label: 'Ổn', face: '🙂' },
  { key: 'met', label: 'Mệt', face: '😮‍💨' },
  { key: 'lo', label: 'Lo', face: '😟' },
  { key: 'te', label: 'Tệ', face: '😣' },
];

const MICRO_ACTIONS = [
  { key: 'water', label: 'Uống một cốc nước', icon: '💧' },
  { key: 'breath', label: 'Hít thở 60 giây', icon: '🌿' },
  { key: 'rest', label: 'Nghỉ mắt một chút', icon: '🌙' },
];

const DESTINATIONS = [
  { route: 'StudyPlanner', icon: '🗓️', title: 'Lịch học mềm', subtitle: 'Tự xếp và tự điều chỉnh' },
  {
    route: 'Community',
    icon: '🤝',
    title: 'Tiếp sức lặng lẽ',
    subtitle: 'Học cùng, không so sánh',
  },
  {
    route: 'Reflection',
    icon: '✨',
    title: 'Nhìn lại tuần',
    subtitle: 'Ghi nhận, không chấm điểm',
  },
  { route: 'Evolution', icon: '🌱', title: 'Tomo lớn lên', subtitle: 'Tiến hóa và trang trí' },
];

function formatTimer(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function DashboardScreen({ navigation }) {
  const evolutionPoints = useAppStore((state) => state.evolutionPoints);
  const evolutionStage = useAppStore((state) => state.evolutionStage);
  const equippedCosmetic = useAppStore((state) => state.equippedCosmetic);
  const {
    stressEntries,
    today,
    todayMood,
    todayActions,
    needsGentleCheckIn,
    reflection,
    checkInMood,
    saveStressEntry,
    saveStressVoice,
    completeMicroAction,
  } = useWellbeing();
  const focus = useFocusTimer(25);
  const voice = useVoiceRecorder();
  const [stressText, setStressText] = useState('');
  const [notice, setNotice] = useState('');

  const handleMood = async (mood) => {
    await checkInMood(mood);
    setNotice('Đã ghi lại cảm xúc. Không có cảm xúc nào bị chấm điểm.');
  };

  const handleStressSave = async () => {
    const saved = await saveStressEntry(stressText);
    if (!saved) return;
    setStressText('');
    setNotice('Đã cất riêng trên thiết bị. Nội dung này không được gửi tới máy chủ.');
  };

  const handleVoiceEnd = async () => {
    const recording = await voice.stopRecording();
    if (!recording) return;
    await saveStressVoice(recording.uri);
    setNotice('Đã lưu bản ghi xả stress trên thiết bị của bạn.');
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Pressable accessibilityRole="button" onPress={() => navigation?.navigate?.('Chat')}>
            <Text style={styles.backText}>← Trò chuyện</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => navigation?.navigate?.('Settings')}>
            <Text style={styles.backText}>Cài đặt</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>NHỊP CỦA BẠN</Text>
            </View>
            <Text style={styles.title}>Hôm nay mình thế nào?</Text>
            <Text style={styles.heroText}>Tomo đi cùng nhịp của bạn, không thúc ép.</Text>
            <Text style={styles.heroPoints}>✦ {evolutionPoints} điểm nỗ lực</Text>
          </View>
          <TomoAvatar
            animationState={focus.isRunning ? 'focused' : 'idle'}
            stage={evolutionStage}
            cosmetic={equippedCosmetic}
            size="large"
            inverted
          />
        </View>

        {needsGentleCheckIn ? (
          <View style={styles.gentleCard}>
            <Text style={styles.gentleTitle}>Tomo thấy mấy hôm nay bạn đang gồng khá nhiều.</Text>
            <Text style={styles.gentleText}>
              Bạn có muốn viết ra một chút ở Hộp Xả Stress cho nhẹ lòng không?
            </Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Check-in một chạm</Text>
          <Text style={styles.description}>Chỉ cần thành thật với khoảnh khắc này.</Text>
          <View style={styles.moodRow}>
            {MOODS.map((mood) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Cảm xúc ${mood.label}`}
                key={mood.key}
                onPress={() => handleMood(mood.key)}
                style={[styles.moodButton, todayMood === mood.key && styles.moodSelected]}
              >
                <Text style={styles.moodFace}>{mood.face}</Text>
                <Text style={styles.moodLabel}>{mood.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hộp Xả Stress</Text>
          <Text style={styles.description}>
            Viết không cần trau chuốt hoặc giữ nút ghi âm. Mọi thứ chỉ nằm trên máy này.
          </Text>
          <TextInput
            accessibilityLabel="Nội dung xả stress"
            multiline
            placeholder="Mình đang thấy..."
            value={stressText}
            onChangeText={setStressText}
            style={styles.stressInput}
          />
          <View style={styles.twoButtons}>
            <Pressable
              accessibilityRole="button"
              disabled={!stressText.trim()}
              onPress={handleStressSave}
              style={[
                styles.primaryButton,
                styles.flexButton,
                !stressText.trim() && styles.disabled,
              ]}
            >
              <Text style={styles.primaryText}>Cất riêng</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Giữ để ghi âm xả stress"
              onPressIn={voice.startRecording}
              onPressOut={handleVoiceEnd}
              style={[
                styles.voiceButton,
                styles.flexButton,
                voice.isRecording && styles.voiceActive,
              ]}
            >
              <Text style={styles.voiceText}>
                {voice.isRecording ? 'Đang nghe…' : '🎙 Giữ để nói'}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.privateNote}>
            {stressEntries.length} lần được cất riêng • không đồng bộ
          </Text>
          {voice.error ? <Text style={styles.error}>{voice.error}</Text> : null}
        </View>

        <View style={styles.card}>
          <View style={styles.headingRow}>
            <View style={styles.headingCopy}>
              <Text style={styles.cardTitle}>Góc học tập trung</Text>
              <Text style={styles.description}>25 phút vừa sức, sau đó nghỉ thật sự.</Text>
            </View>
            <Text style={styles.timer}>{formatTimer(focus.remainingSeconds)}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={focus.isRunning ? focus.stop : focus.start}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryText}>
              {focus.isRunning ? 'Dừng nhẹ nhàng' : 'Bắt đầu 25 phút'}
            </Text>
          </Pressable>
          {focus.message ? <Text style={styles.helper}>{focus.message}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Một việc nhỏ cho cơ thể</Text>
          {MICRO_ACTIONS.map((action) => {
            const completed = todayActions.has(`${today}:${action.key}`);
            return (
              <Pressable
                accessibilityRole="button"
                disabled={completed}
                key={action.key}
                onPress={async () => {
                  await completeMicroAction(action.key);
                  setNotice('Tomo ghi nhận việc bạn vừa chăm sóc chính mình.');
                }}
                style={[styles.microAction, completed && styles.completed]}
              >
                <Text style={styles.microIcon}>{action.icon}</Text>
                <Text style={styles.microLabel}>
                  {completed ? `Đã làm: ${action.label}` : action.label}
                </Text>
                <Text style={styles.microMark}>{completed ? '✓' : '+'}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Đi tiếp theo cách của bạn</Text>
        <View style={styles.destinationGrid}>
          {DESTINATIONS.map((item, index) => (
            <Pressable
              accessibilityRole="button"
              key={item.route}
              onPress={() => navigation?.navigate?.(item.route)}
              style={[styles.destination, styles[`destinationTone${index + 1}`]]}
            >
              <Text style={styles.destinationIcon}>{item.icon}</Text>
              <Text style={styles.destinationTitle}>{item.title}</Text>
              <Text style={styles.destinationSubtitle}>{item.subtitle}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.progressBand}>
          <Text style={styles.progressEyebrow}>TOMO ĐANG LỚN CÙNG BẠN</Text>
          <Text style={styles.progressTitle}>{evolutionPoints} điểm nỗ lực</Text>
          <Text style={styles.progressText}>{reflection.praise}</Text>
        </View>

        {notice ? (
          <Text accessibilityLiveRegion="polite" style={styles.notice}>
            {notice}
          </Text>
        ) : null}
      </ScrollView>
      <AppDock activeRoute="Dashboard" navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.canvas, flex: 1 },
  container: { flex: 1, backgroundColor: COLORS.canvas },
  content: { padding: 18, paddingTop: 42, paddingBottom: 56 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  backText: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADII.pill,
    borderWidth: 1,
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  hero: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 190,
    overflow: 'hidden',
    padding: 20,
    ...SHADOWS.floating,
  },
  heroCopy: { flex: 1 },
  heroPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF20',
    borderColor: '#FFFFFF38',
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroPillText: { color: COLORS.peachSoft, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  eyebrow: { color: COLORS.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  title: {
    color: COLORS.white,
    fontFamily: 'serif',
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 32,
    marginTop: 12,
  },
  heroText: { color: COLORS.lavenderSoft, fontSize: 13, lineHeight: 19, marginTop: 7 },
  heroPoints: { color: COLORS.gold, fontSize: 12, fontWeight: '800', marginTop: 14 },
  gentleCard: {
    backgroundColor: COLORS.accentSoft,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    borderRadius: RADII.medium,
    padding: 15,
    marginBottom: 14,
  },
  gentleTitle: { color: COLORS.ink, fontWeight: '800' },
  gentleText: { color: COLORS.brown, lineHeight: 20, marginTop: 5 },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.large,
    padding: 17,
    marginBottom: 12,
    ...SHADOWS.card,
  },
  cardTitle: { color: COLORS.ink, fontSize: 18, fontWeight: '900', letterSpacing: -0.2 },
  description: { color: COLORS.inkMuted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  moodButton: {
    alignItems: 'center',
    width: '23%',
    paddingVertical: 10,
    backgroundColor: COLORS.paper,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  moodSelected: { backgroundColor: COLORS.pinkSoft, borderColor: COLORS.primary },
  moodFace: { fontSize: 25 },
  moodLabel: { color: COLORS.brown, fontSize: 12, marginTop: 4 },
  stressInput: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.small,
    padding: 12,
    marginTop: 13,
    color: COLORS.ink,
    backgroundColor: COLORS.paper,
    textAlignVertical: 'top',
  },
  twoButtons: { flexDirection: 'row', gap: 10 },
  flexButton: { flex: 1 },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 13,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryText: { color: COLORS.white, fontWeight: '800' },
  voiceButton: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 13,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  voiceActive: { backgroundColor: COLORS.pinkSoft },
  voiceText: { color: COLORS.brown, fontWeight: '800' },
  disabled: { opacity: 0.4 },
  privateNote: { color: COLORS.inkMuted, fontSize: 12, marginTop: 10 },
  error: { color: COLORS.danger, fontSize: 12, marginTop: 7 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headingCopy: { flex: 1 },
  timer: { color: COLORS.accent, fontSize: 25, fontWeight: '900', marginLeft: 12 },
  helper: { color: COLORS.inkMuted, fontSize: 12, lineHeight: 18, marginTop: 9 },
  microAction: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 13,
  },
  completed: { opacity: 0.55 },
  microIcon: { fontSize: 19, width: 34 },
  microLabel: { color: COLORS.ink, flex: 1 },
  microMark: { color: COLORS.accent, fontSize: 21, fontWeight: '800' },
  sectionTitle: {
    color: COLORS.ink,
    fontSize: 19,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 10,
  },
  destinationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  destination: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.large,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 132,
    padding: 15,
    width: '48%',
    ...SHADOWS.card,
  },
  destinationTone1: { backgroundColor: COLORS.peachSoft },
  destinationTone2: { backgroundColor: COLORS.lavenderSoft },
  destinationTone3: { backgroundColor: COLORS.pinkSoft },
  destinationTone4: { backgroundColor: COLORS.paper },
  destinationIcon: { fontSize: 22 },
  destinationTitle: { color: COLORS.ink, fontWeight: '800', marginTop: 7 },
  destinationSubtitle: { color: COLORS.inkMuted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  progressBand: {
    backgroundColor: COLORS.primary,
    borderRadius: RADII.large,
    padding: 20,
    ...SHADOWS.card,
  },
  progressEyebrow: {
    color: COLORS.peachSoft,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  progressTitle: { color: COLORS.white, fontSize: 24, fontWeight: '800', marginTop: 6 },
  progressText: { color: COLORS.lavenderSoft, lineHeight: 20, marginTop: 6 },
  notice: {
    color: COLORS.inkMuted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 14,
  },
});
