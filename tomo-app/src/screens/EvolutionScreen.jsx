import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import AppDock from '../components/AppDock.jsx';
import TomoAvatar from '../components/TomoAvatar.jsx';
import { COLORS, SHADOWS } from '../constants/theme.js';
import { useAppStore } from '../store/useAppStore.js';

const STAGES = [
  { stage: 1, name: 'Mầm non', threshold: 0, description: 'Đang học cách tin tưởng và lắng nghe.' },
  { stage: 2, name: 'Bạn nhỏ', threshold: 10, description: 'Biết đồng hành qua những ngày khó.' },
  {
    stage: 3,
    name: 'Người bạn trưởng thành',
    threshold: 30,
    description: 'Mang theo dấu vết của một hành trình bền bỉ.',
  },
];

const COSMETICS = [
  { id: 'basic-shirt', name: 'Áo thun bình dị', icon: '👕', price: 0 },
  { id: 'round-glasses', name: 'Kính tròn ham học', icon: '👓', price: 4 },
  { id: 'leaf-hat', name: 'Mũ lá dịu mát', icon: '🍃', price: 6 },
  { id: 'navy-suit', name: 'Bộ vest xanh', icon: '🧥', price: 12 },
];

function progressFor(points, stage) {
  if (stage >= 3) return 1;
  const from = stage === 1 ? 0 : 10;
  const to = stage === 1 ? 10 : 30;
  return Math.min(1, Math.max(0, (points - from) / (to - from)));
}

export default function EvolutionScreen({ navigation }) {
  const points = useAppStore((state) => state.evolutionPoints);
  const stage = useAppStore((state) => state.evolutionStage);
  const effortBalance = useAppStore((state) => state.effortBalance);
  const ownedCosmetics = useAppStore((state) => state.ownedCosmetics);
  const equippedCosmetic = useAppStore((state) => state.equippedCosmetic);
  const milestones = useAppStore((state) => state.evolutionMilestones);
  const buyCosmetic = useAppStore((state) => state.buyCosmetic);
  const equipCosmetic = useAppStore((state) => state.equipCosmetic);
  const [notice, setNotice] = useState('');
  const current = STAGES[stage - 1];
  const next = STAGES[stage] ?? null;
  const progress = progressFor(points, stage);

  const handleCosmetic = async (cosmetic) => {
    if (ownedCosmetics.includes(cosmetic.id)) {
      await equipCosmetic(cosmetic.id);
      setNotice(`Tomo đã mặc ${cosmetic.name}.`);
      return;
    }
    const bought = await buyCosmetic(cosmetic);
    setNotice(
      bought
        ? `Đã đổi ${cosmetic.price} điểm trang trí.`
        : 'Bạn chưa đủ điểm trang trí cho món này.',
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => navigation?.goBack?.()}>
          <Text style={styles.back}>← Nhịp của bạn</Text>
        </Pressable>
        <Text style={styles.eyebrow}>HÀNH TRÌNH CỦA TOMO</Text>
        <Text style={styles.title}>Lớn lên từ những điều bạn thật sự làm</Text>

        <View style={styles.hero}>
          <TomoAvatar
            animationState="happy"
            stage={stage}
            cosmetic={equippedCosmetic}
            size="large"
            inverted
          />
          <Text style={styles.stageName}>
            Giai đoạn {stage} • {current.name}
          </Text>
          <Text style={styles.stageDescription}>{current.description}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            {next
              ? `${points}/${next.threshold} điểm để tới ${next.name}`
              : `${points} điểm • Tomo đã ở hình hài trưởng thành`}
          </Text>
        </View>

        <View style={styles.ruleCard}>
          <Text style={styles.ruleTitle}>Không thể trả tiền để lớn nhanh</Text>
          <Text style={styles.ruleText}>
            Tiền hoặc điểm trang trí chỉ đổi ngoại hình. Giai đoạn tiến hóa chỉ đến từ chăm sóc bản
            thân, học tập trung và tương tác lành mạnh.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Ba chặng đường</Text>
        {STAGES.map((item) => {
          const unlocked = stage >= item.stage;
          return (
            <View key={item.stage} style={[styles.stageRow, !unlocked && styles.lockedStage]}>
              <Text style={styles.stageIcon}>
                {unlocked ? ['🌱', '🌿', '🌳'][item.stage - 1] : '○'}
              </Text>
              <View style={styles.stageCopy}>
                <Text style={styles.stageRowTitle}>{item.name}</Text>
                <Text style={styles.stageRowText}>
                  {item.threshold} điểm • {item.description}
                </Text>
              </View>
            </View>
          );
        })}

        <View style={styles.shopHeader}>
          <Text style={styles.sectionTitle}>Tủ đồ của Tomo</Text>
          <Text style={styles.balance}>{effortBalance} điểm trang trí</Text>
        </View>
        <Text style={styles.shopHint}>
          Điểm được tạo từ hành động thật. Mua đồ không thay đổi giai đoạn của Tomo.
        </Text>
        <View style={styles.shopGrid}>
          {COSMETICS.map((cosmetic) => {
            const owned = ownedCosmetics.includes(cosmetic.id);
            const equipped = equippedCosmetic === cosmetic.id;
            return (
              <Pressable
                accessibilityRole="button"
                key={cosmetic.id}
                onPress={() => handleCosmetic(cosmetic)}
                style={[styles.cosmetic, equipped && styles.cosmeticEquipped]}
              >
                <Text style={styles.cosmeticIcon}>{cosmetic.icon}</Text>
                <Text style={styles.cosmeticName}>{cosmetic.name}</Text>
                <Text style={styles.cosmeticPrice}>
                  {equipped ? 'Đang mặc' : owned ? 'Mặc' : `${cosmetic.price} điểm`}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {milestones.length ? (
          <View style={styles.memoryCard}>
            <Text style={styles.memoryTitle}>Kỷ niệm tiến hóa</Text>
            {milestones.map((item) => (
              <Text key={`${item.stage}-${item.ts}`} style={styles.memoryText}>
                • Tomo đạt giai đoạn {item.stage} vào {item.ts.slice(0, 10)}
              </Text>
            ))}
          </View>
        ) : null}
        {notice ? (
          <Text accessibilityLiveRegion="polite" style={styles.notice}>
            {notice}
          </Text>
        ) : null}
      </ScrollView>
      <AppDock activeRoute="Evolution" navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.canvas, flex: 1 },
  container: { flex: 1, backgroundColor: COLORS.canvas },
  content: { padding: 20, paddingTop: 40, paddingBottom: 48 },
  back: { color: COLORS.primary, fontWeight: '800', marginBottom: 22 },
  eyebrow: { color: COLORS.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: {
    color: COLORS.ink,
    fontFamily: 'serif',
    fontSize: 29,
    fontWeight: '900',
    lineHeight: 35,
    marginTop: 7,
    marginBottom: 17,
  },
  hero: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 26,
    alignItems: 'center',
    padding: 21,
    ...SHADOWS.floating,
  },
  stageName: { color: COLORS.white, fontSize: 21, fontWeight: '800', marginTop: 5 },
  stageDescription: {
    color: COLORS.lavenderSoft,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 5,
  },
  progressTrack: {
    height: 9,
    backgroundColor: '#7E6088',
    borderRadius: 10,
    width: '100%',
    overflow: 'hidden',
    marginTop: 18,
  },
  progressFill: { height: 9, backgroundColor: COLORS.peach, borderRadius: 10 },
  progressLabel: { color: COLORS.paper, fontSize: 12, marginTop: 8 },
  ruleCard: {
    backgroundColor: COLORS.paper,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.peach,
    borderRadius: 10,
    padding: 14,
    marginTop: 14,
  },
  ruleTitle: { color: COLORS.brown, fontWeight: '800' },
  ruleText: { color: COLORS.inkMuted, lineHeight: 19, marginTop: 4 },
  sectionTitle: {
    color: COLORS.ink,
    fontSize: 19,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 10,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 17,
    padding: 13,
    marginBottom: 8,
    ...SHADOWS.card,
  },
  lockedStage: { opacity: 0.5 },
  stageIcon: { fontSize: 28, width: 43 },
  stageCopy: { flex: 1 },
  stageRowTitle: { color: COLORS.ink, fontWeight: '800' },
  stageRowText: { color: COLORS.inkMuted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  shopHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  balance: { color: COLORS.primary, fontSize: 12, fontWeight: '800', marginBottom: 12 },
  shopHint: { color: COLORS.inkMuted, fontSize: 13, lineHeight: 18, marginBottom: 10 },
  shopGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  cosmetic: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    padding: 13,
    ...SHADOWS.card,
  },
  cosmeticEquipped: { borderColor: COLORS.primary, backgroundColor: COLORS.lavenderSoft },
  cosmeticIcon: { fontSize: 28 },
  cosmeticName: { color: COLORS.ink, fontWeight: '800', marginTop: 6 },
  cosmeticPrice: { color: COLORS.primary, fontSize: 12, marginTop: 4 },
  memoryCard: {
    backgroundColor: COLORS.pinkSoft,
    borderRadius: 16,
    padding: 15,
    marginTop: 16,
  },
  memoryTitle: { color: COLORS.ink, fontWeight: '800' },
  memoryText: { color: COLORS.inkMuted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  notice: { color: COLORS.inkMuted, textAlign: 'center', marginTop: 14 },
});
