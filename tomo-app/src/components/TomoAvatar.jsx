import { Image, StyleSheet, Text, View } from 'react-native';

import mascotAngry from '../../assets/tomo/mascot-angry.png';
import mascotHappy from '../../assets/tomo/mascot-happy.png';
import mascotIdle from '../../assets/tomo/mascot-idle.png';
import mascotLaugh from '../../assets/tomo/mascot-laugh.png';
import mascotSad from '../../assets/tomo/mascot-sad.png';
import { COLORS } from '../constants/theme.js';

const LABELS = {
  idle: 'Tomo đang lắng nghe',
  happy: 'Tomo vui',
  comfort: 'Tomo ở bên bạn',
  focused: 'Tomo đang tập trung',
  speaking: 'Tomo đang nói',
  celebrating: 'Tomo ăn mừng',
};

const MASCOT_IMAGES = {
  idle: mascotIdle,
  happy: mascotHappy,
  comfort: mascotSad,
  focused: mascotAngry,
  speaking: mascotLaugh,
  celebrating: mascotLaugh,
};

const COSMETIC_ICONS = {
  'basic-shirt': '👕',
  'round-glasses': '👓',
  'leaf-hat': '🍃',
  'navy-suit': '🧥',
};

export default function TomoAvatar({
  animationState = 'idle',
  stage = 1,
  cosmetic = 'basic-shirt',
  size = 'normal',
  inverted = false,
}) {
  const resolvedState = MASCOT_IMAGES[animationState] ? animationState : 'idle';
  const isLarge = size === 'large';

  return (
    <View style={[styles.avatar, isLarge && styles.avatarLarge]}>
      <View
        accessibilityLabel={`Tomo giai đoạn ${stage}`}
        style={[styles.mascotFrame, isLarge ? styles.mascotLarge : styles.mascotNormal]}
      >
        <Image
          accessibilityLabel={LABELS[resolvedState]}
          resizeMode="contain"
          source={MASCOT_IMAGES[resolvedState]}
          style={styles.mascotImage}
          testID={`tomo-mascot-${resolvedState}`}
        />
        {stage >= 2 ? (
          <Text style={[styles.stageBadge, isLarge && styles.stageBadgeLarge]}>
            {stage === 3 ? '✦' : '⌁'}
          </Text>
        ) : null}
        {isLarge ? <Text style={styles.cosmetic}>{COSMETIC_ICONS[cosmetic]}</Text> : null}
      </View>
      <Text style={[styles.label, inverted && styles.labelInverted]}>{LABELS[resolvedState]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', padding: 8 },
  avatarLarge: { paddingHorizontal: 12, paddingTop: 10 },
  mascotFrame: { position: 'relative' },
  mascotNormal: { height: 54, width: 54 },
  mascotLarge: { height: 94, width: 94 },
  mascotImage: { height: '100%', width: '100%' },
  stageBadge: {
    color: COLORS.gold,
    fontSize: 18,
    fontWeight: '900',
    position: 'absolute',
    right: -5,
    top: -7,
  },
  stageBadgeLarge: { fontSize: 24, right: -7, top: -9 },
  cosmetic: {
    fontSize: 24,
    left: -11,
    position: 'absolute',
    top: -10,
    transform: [{ rotate: '-12deg' }],
  },
  label: { color: COLORS.inkMuted, fontSize: 11, fontWeight: '600', marginTop: 6 },
  labelInverted: { color: COLORS.lavenderSoft },
});
