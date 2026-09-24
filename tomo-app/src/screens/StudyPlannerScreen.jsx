import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import AppDock from '../components/AppDock.jsx';
import { COLORS, SHADOWS } from '../constants/theme.js';
import { useStudyPlanner } from '../hooks/useStudyPlanner.js';

const ENERGY_WINDOWS = [
  { key: 'morning', label: 'Sáng' },
  { key: 'afternoon', label: 'Chiều' },
  { key: 'evening', label: 'Tối' },
];
const DAYS = ['Hôm nay', 'Ngày +1', 'Ngày +2', 'Ngày +3', 'Ngày +4', 'Ngày +5', 'Ngày +6'];

export default function StudyPlannerScreen({ navigation }) {
  const planner = useStudyPlanner();
  const [name, setName] = useState('');
  const [currentScore, setCurrentScore] = useState('');
  const [targetScore, setTargetScore] = useState('');
  const [isDifficult, setIsDifficult] = useState(false);
  const [commitmentTitle, setCommitmentTitle] = useState('');
  const [commitmentDay, setCommitmentDay] = useState('0');
  const [commitmentStart, setCommitmentStart] = useState('7');
  const [commitmentEnd, setCommitmentEnd] = useState('16');
  const [testSubjectId, setTestSubjectId] = useState('');
  const [testScore, setTestScore] = useState('');
  const [notice, setNotice] = useState('');

  const handleAddSubject = async () => {
    const saved = await planner.saveStudySubject({
      name,
      currentScore,
      targetScore,
      isDifficult,
    });
    if (!saved) return;
    setName('');
    setCurrentScore('');
    setTargetScore('');
    setIsDifficult(false);
    setTestSubjectId((current) => current || saved.id);
    setNotice('Đã thêm môn học.');
  };

  const handleAddCommitment = async () => {
    const saved = await planner.addStudyCommitment({
      title: commitmentTitle,
      day: commitmentDay,
      startHour: commitmentStart,
      endHour: commitmentEnd,
    });
    if (!saved) return;
    setCommitmentTitle('');
    setNotice('Đã giữ lại khung giờ bận này.');
  };

  const handleTestResult = async () => {
    const subjectId = testSubjectId || planner.studySubjects[0]?.id;
    if (!subjectId || testScore.trim() === '') return;
    await planner.recordTestResult({ subjectId, score: testScore });
    setTestScore('');
    setNotice('Đã ghi nhận kết quả. Hãy tạo lại lịch để Tomo bù lỗ hổng nhẹ nhàng.');
  };

  const handleGenerate = async () => {
    const next = await planner.generatePlan();
    setNotice(
      next.length
        ? 'Lịch mới đã được dàn đều, không có cảnh báo đỏ hay phạt trễ.'
        : 'Hãy thêm ít nhất một môn trước khi tạo lịch.',
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => navigation?.goBack?.()}>
          <Text style={styles.back}>← Nhịp của bạn</Text>
        </Pressable>
        <Text style={styles.eyebrow}>KỶ LUẬT MỀM</Text>
        <Text style={styles.title}>Lịch học biết nhường chỗ cho bạn</Text>
        <Text style={styles.intro}>
          Tomo ưu tiên môn khó vào lúc bạn nhiều năng lượng và tự bù lại sau điểm kiểm tra thấp.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Môn và mục tiêu</Text>
          <TextInput
            placeholder="Tên môn, ví dụ Toán"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <View style={styles.row}>
            <TextInput
              keyboardType="numeric"
              placeholder="Điểm hiện tại"
              value={currentScore}
              onChangeText={setCurrentScore}
              style={[styles.input, styles.half]}
            />
            <TextInput
              keyboardType="numeric"
              placeholder="Điểm mục tiêu"
              value={targetScore}
              onChangeText={setTargetScore}
              style={[styles.input, styles.half]}
            />
          </View>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isDifficult }}
            onPress={() => setIsDifficult((value) => !value)}
            style={[styles.choice, isDifficult && styles.choiceActive]}
          >
            <Text style={styles.choiceText}>
              {isDifficult ? '✓ ' : ''}Đây là môn mình dễ nản nhất
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={!name.trim()}
            onPress={handleAddSubject}
            style={[styles.primary, !name.trim() && styles.disabled]}
          >
            <Text style={styles.primaryText}>Thêm môn</Text>
          </Pressable>
          {planner.studySubjects.map((subject) => (
            <View key={subject.id} style={styles.listItem}>
              <Text style={styles.itemTitle}>
                {subject.name}
                {subject.isDifficult ? ' • cần nâng đỡ' : ''}
              </Text>
              <Text style={styles.itemMeta}>
                {subject.currentScore} → mục tiêu {subject.targetScore}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>2. Giờ đã bận</Text>
          <TextInput
            placeholder="Học ở trường / học thêm"
            value={commitmentTitle}
            onChangeText={setCommitmentTitle}
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>Ngày</Text>
          <View style={styles.dayPicker}>
            {DAYS.map((day, index) => (
              <Pressable
                accessibilityRole="button"
                key={day}
                onPress={() => setCommitmentDay(String(index))}
                style={[styles.dayChip, Number(commitmentDay) === index && styles.dayChipActive]}
              >
                <Text
                  style={[
                    styles.dayChipText,
                    Number(commitmentDay) === index && styles.dayChipTextActive,
                  ]}
                >
                  {index === 0 ? 'Nay' : `+${index}`}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.row}>
            <TextInput
              keyboardType="numeric"
              placeholder="Từ giờ"
              value={commitmentStart}
              onChangeText={setCommitmentStart}
              style={[styles.input, styles.half]}
            />
            <TextInput
              keyboardType="numeric"
              placeholder="Đến giờ"
              value={commitmentEnd}
              onChangeText={setCommitmentEnd}
              style={[styles.input, styles.half]}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={!commitmentTitle.trim()}
            onPress={handleAddCommitment}
            style={[styles.secondary, !commitmentTitle.trim() && styles.disabled]}
          >
            <Text style={styles.secondaryText}>Giữ khung giờ này</Text>
          </Pressable>
          {planner.studyCommitments.map((item) => (
            <Text key={item.id} style={styles.commitment}>
              • {DAYS[item.day] ?? `Ngày +${item.day}`}: {item.title}, {item.startHour}h–
              {item.endHour}h
            </Text>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>3. Giờ vàng của bạn</Text>
          <View style={styles.row}>
            {ENERGY_WINDOWS.map((window) => (
              <Pressable
                key={window.key}
                onPress={() => planner.setEnergyWindow(window.key)}
                style={[styles.energy, planner.energyWindow === window.key && styles.energyActive]}
              >
                <Text style={styles.energyText}>{window.label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable accessibilityRole="button" onPress={handleGenerate} style={styles.primary}>
            <Text style={styles.primaryText}>Tạo lịch 7 ngày</Text>
          </Pressable>
        </View>

        {planner.studyPlan.length ? (
          <View style={styles.planCard}>
            <Text style={styles.planTitle}>Lịch tự học vừa sức</Text>
            {planner.studyPlan.map((item) => (
              <View key={item.id} style={styles.planItem}>
                <Text style={styles.planDay}>{DAYS[item.day]}</Text>
                <View style={styles.planCopy}>
                  <Text style={styles.planItemTitle}>
                    {item.startHour}:00 • {item.subjectName} • {item.durationMinutes} phút
                  </Text>
                  <Text style={styles.planItemMeta}>{item.reason}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Điểm kiểm tra mới</Text>
          <Text style={styles.hint}>
            Chọn môn, nhập điểm rồi tạo lại lịch. Tomo chỉ đổi ưu tiên, không phán xét.
          </Text>
          <View style={styles.wrap}>
            {planner.studySubjects.map((subject) => (
              <Pressable
                key={subject.id}
                onPress={() => setTestSubjectId(subject.id)}
                style={[
                  styles.subjectChip,
                  (testSubjectId || planner.studySubjects[0]?.id) === subject.id &&
                    styles.subjectChipActive,
                ]}
              >
                <Text style={styles.chipText}>{subject.name}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            keyboardType="numeric"
            placeholder="Điểm vừa nhận"
            value={testScore}
            onChangeText={setTestScore}
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            disabled={!planner.studySubjects.length || !testScore.trim()}
            onPress={handleTestResult}
            style={[
              styles.secondary,
              (!planner.studySubjects.length || !testScore.trim()) && styles.disabled,
            ]}
          >
            <Text style={styles.secondaryText}>Ghi nhận và điều chỉnh</Text>
          </Pressable>
        </View>
        {notice ? (
          <Text accessibilityLiveRegion="polite" style={styles.notice}>
            {notice}
          </Text>
        ) : null}
      </ScrollView>
      <AppDock activeRoute="StudyPlanner" navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.canvas, flex: 1 },
  container: { flex: 1, backgroundColor: COLORS.canvas },
  content: { padding: 20, paddingTop: 40, paddingBottom: 48 },
  back: { color: COLORS.primary, fontWeight: '800', marginBottom: 22 },
  eyebrow: { color: COLORS.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: COLORS.ink, fontSize: 29, fontWeight: '900', lineHeight: 35, marginTop: 7 },
  intro: { color: COLORS.inkMuted, lineHeight: 21, marginTop: 8, marginBottom: 18 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 17,
    marginBottom: 12,
    ...SHADOWS.card,
  },
  cardTitle: { color: '#28332f', fontSize: 18, fontWeight: '800', marginBottom: 9 },
  input: {
    borderWidth: 1,
    borderColor: '#d6ddd9',
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 10,
    marginTop: 8,
    color: '#28332f',
    backgroundColor: '#fbfcfb',
  },
  row: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  third: { flex: 1 },
  fieldLabel: { color: COLORS.inkMuted, fontSize: 12, fontWeight: '800', marginTop: 13 },
  dayPicker: { flexDirection: 'row', gap: 6, marginTop: 7 },
  dayChip: {
    alignItems: 'center',
    backgroundColor: '#F0EEE8',
    borderRadius: 11,
    flex: 1,
    paddingVertical: 9,
  },
  dayChipActive: { backgroundColor: COLORS.primary },
  dayChipText: { color: COLORS.inkMuted, fontSize: 11, fontWeight: '800' },
  dayChipTextActive: { color: COLORS.white },
  choice: { borderRadius: 9, backgroundColor: '#f1f3f0', padding: 11, marginTop: 10 },
  choiceActive: { backgroundColor: '#dbe9e3' },
  choiceText: { color: '#42564f', fontWeight: '700' },
  primary: {
    backgroundColor: COLORS.primary,
    borderRadius: 13,
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 11,
  },
  primaryText: { color: '#fff', fontWeight: '800' },
  secondary: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 13,
    alignItems: 'center',
    paddingVertical: 11,
    marginTop: 10,
  },
  secondaryText: { color: COLORS.primary, fontWeight: '800' },
  disabled: { opacity: 0.4 },
  listItem: { borderTopWidth: 1, borderTopColor: '#edf0ee', paddingTop: 10, marginTop: 10 },
  itemTitle: { color: '#2f3935', fontWeight: '800' },
  itemMeta: { color: '#728078', fontSize: 12, lineHeight: 17, marginTop: 2 },
  commitment: { color: '#5d6963', fontSize: 13, marginTop: 8 },
  energy: {
    flex: 1,
    backgroundColor: '#eef1ef',
    borderRadius: 9,
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  energyActive: { backgroundColor: '#cfe2da' },
  energyText: { color: '#3d5c53', fontWeight: '700' },
  planCard: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    ...SHADOWS.floating,
  },
  planTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 7 },
  planItem: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#49615a',
    paddingVertical: 11,
  },
  planDay: { color: '#aad0c3', fontSize: 12, fontWeight: '800', width: 68 },
  planCopy: { flex: 1 },
  planItemTitle: { color: COLORS.white, fontWeight: '800' },
  planItemMeta: { color: '#BFD2CA', fontSize: 12, lineHeight: 17, marginTop: 2 },
  hint: { color: '#6d7973', fontSize: 13, lineHeight: 18 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  subjectChip: {
    backgroundColor: '#edf0ee',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  subjectChipActive: { backgroundColor: '#cfe2da' },
  chipText: { color: '#3d5c53', fontWeight: '700' },
  notice: { color: '#58675f', textAlign: 'center', lineHeight: 19, marginTop: 4 },
});
