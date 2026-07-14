import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, shadow } from '../theme/theme';

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function DarkButton({ title, onPress, style, disabled }) {
  return (
    <TouchableOpacity
      style={[styles.darkBtn, disabled && { opacity: 0.4 }, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={styles.darkBtnText}>{title}</Text>
    </TouchableOpacity>
  );
}

export function Chip({ label, active, onPress, color }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.chip,
        active && { backgroundColor: color || colors.dark },
      ]}
    >
      <Text style={[styles.chipText, active && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function ScreenTitle({ children }) {
  return <Text style={styles.screenTitle}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: 16,
    ...shadow,
  },
  darkBtn: {
    backgroundColor: colors.dark,
    borderRadius: radius.button,
    paddingVertical: 16,
    alignItems: 'center',
  },
  darkBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.chip,
    backgroundColor: colors.card,
    marginRight: 8,
    marginBottom: 8,
    ...shadow,
  },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  screenTitle: { fontSize: 28, fontWeight: '800', color: colors.text },
});
