import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, SHADOWS } from '../constants/theme.js';

const LABELS = {
  idle: 'Tomo đang lắng nghe',
  happy: 'Tomo vui',
  comfort: 'Tomo ở bên bạn',
  focused: 'Tomo đang tập trung',
  speaking: 'Tomo đang nói',
  celebrating: 'Tomo ăn mừng',
};

export default function TomoAvatar({
  animationState = 'idle',
  stage = 1,
  cosmetic = 'basic-shirt',
  size = 'normal',
  inverted = false,
}) {
  const [isMouthOpen, setIsMouthOpen] = useState(false);

  useEffect(() => {
    if (animationState !== 'speaking') return undefined;
    const timer = setInterval(() => setIsMouthOpen((value) => !value), 220);
    return () => clearInterval(timer);
  }, [animationState]);

  const cosmeticIcon = {
    'basic-shirt': '👕',
    'round-glasses': '👓',
    'leaf-hat': '🍃',
    'navy-suit': '🧥',
  }[cosmetic];
  const isLarge = size === 'large';
  const mouth = animationState === 'speaking' && isMouthOpen ? '○' : '⌣';

  return (
    <View style={styles.avatar}>
      <View
        accessibilityLabel={`Tomo giai đoạn ${stage}`}
        style={[
          styles.mascot,
          isLarge ? styles.mascotLarge : styles.mascotNormal,
          stage === 2 && styles.stageTwo,
          stage === 3 && styles.stageThree,
        ]}
      >
        <View style={[styles.ear, styles.leftEar]} />
        <View style={[styles.ear, styles.rightEar]} />
        {stage >= 2 ? <Text style={styles.sprout}>{stage === 3 ? '✦' : '⌁'}</Text> : null}
        {isLarge ? <Text style={styles.cosmetic}>{cosmeticIcon}</Text> : null}
        <View style={styles.faceRow}>
          <View style={styles.eye} />
          <View style={styles.eye} />
        </View>
        <Text style={[styles.mouth, animationState === 'comfort' && styles.comfortMouth]}>
          {animationState === 'comfort' ? '—' : mouth}
        </Text>
        <View style={[styles.blush, styles.leftBlush]} />
        <View style={[styles.blush, styles.rightBlush]} />
      </View>
      <Text style={[styles.label, inverted && styles.labelInverted]}>
        {LABELS[animationState] ?? LABELS.idle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', padding: 8 },
  mascot: {
    alignItems: 'center',
    backgroundColor: '#BFD8B8',
    borderColor: '#E9F1E5',
    borderWidth: 3,
    justifyContent: 'center',
    position: 'relative',
    ...SHADOWS.card,
  },
  mascotNormal: { borderRadius: 27, height: 54, width: 54 },
  mascotLarge: { borderRadius: 47, height: 94, width: 94 },
  stageTwo: { backgroundColor: '#8FC4AA' },
  stageThree: { backgroundColor: '#66A98E', borderColor: '#DCEBDD' },
  ear: {
    backgroundColor: '#86B690',
    borderRadius: 12,
    height: 20,
    position: 'absolute',
    top: -5,
    width: 18,
  },
  leftEar: { left: 5, transform: [{ rotate: '-24deg' }] },
  rightEar: { right: 5, transform: [{ rotate: '24deg' }] },
  sprout: {
    color: COLORS.gold,
    fontSize: 23,
    fontWeight: '900',
    position: 'absolute',
    right: -4,
    top: -15,
  },
  cosmetic: {
    fontSize: 24,
    left: -11,
    position: 'absolute',
    top: -16,
    transform: [{ rotate: '-12deg' }],
  },
  faceRow: { flexDirection: 'row', gap: 15, marginTop: 4 },
  eye: { backgroundColor: COLORS.primaryDark, borderRadius: 5, height: 7, width: 7 },
  mouth: { color: COLORS.primaryDark, fontSize: 17, fontWeight: '900', lineHeight: 18 },
  comfortMouth: { marginTop: -1 },
  blush: {
    backgroundColor: '#E9A58E',
    borderRadius: 4,
    height: 5,
    opacity: 0.65,
    position: 'absolute',
    top: '59%',
    width: 9,
  },
  leftBlush: { left: 8 },
  rightBlush: { right: 8 },
  label: { color: COLORS.inkMuted, fontSize: 11, fontWeight: '600', marginTop: 6 },
  labelInverted: { color: '#D7E4DF' },
});
