import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, RADII, SHADOWS } from '../constants/theme.js';

const ITEMS = [
  { route: 'Dashboard', icon: '⌂', label: 'Hôm nay' },
  { route: 'StudyPlanner', icon: '▦', label: 'Lịch học' },
  { route: 'Community', icon: '◌', label: 'Cùng học' },
  { route: 'Evolution', icon: '✦', label: 'Tomo' },
];

export default function AppDock({ activeRoute, navigation }) {
  return (
    <View style={styles.wrapper}>
      <View accessibilityRole="tablist" style={styles.dock}>
        {ITEMS.map((item) => {
          const isActive = item.route === activeRoute;
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              key={item.route}
              onPress={() => {
                if (!isActive) navigation?.navigate?.(item.route);
              }}
              style={({ pressed }) => [
                styles.item,
                isActive && styles.activeItem,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.icon, isActive && styles.activeIcon]}>{item.icon}</Text>
              <Text style={[styles.label, isActive && styles.activeLabel]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.canvas,
    paddingBottom: 12,
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  dock: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.pinkSoft,
    borderRadius: RADII.large,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 66,
    padding: 6,
    ...SHADOWS.floating,
  },
  item: {
    alignItems: 'center',
    borderRadius: RADII.medium,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
  },
  activeItem: { backgroundColor: COLORS.lavenderSoft },
  icon: { color: COLORS.inkMuted, fontSize: 21, fontWeight: '800', lineHeight: 23 },
  activeIcon: { color: COLORS.primaryDark },
  label: { color: COLORS.inkMuted, fontSize: 10, fontWeight: '700', marginTop: 2 },
  activeLabel: { color: COLORS.primary, fontWeight: '900' },
  pressed: { opacity: 0.7 },
});
