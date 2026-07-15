import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, fonts, gradients } from '../theme/theme';

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Carte avec fond dégradé pastel (ex. carte de solde), fidèle aux maquettes. */
export function GradientCard({ children, style, colors: grad = gradients.solde }) {
  return (
    <LinearGradient
      colors={grad}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, style]}
    >
      {children}
    </LinearGradient>
  );
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

export function Chip({ label, icone, active, onPress, color }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.chip,
        active && { backgroundColor: color || colors.dark },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icone && (
          <Ionicons name={icone} size={14} color={active ? '#fff' : color || colors.text} />
        )}
        <Text style={[styles.chipText, active && { color: '#fff' }]}>{label}</Text>
      </View>
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
  darkBtnText: { color: '#fff', fontFamily: fonts.bold, fontSize: 15 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.chip,
    backgroundColor: colors.card,
    marginRight: 8,
    marginBottom: 8,
    ...shadow,
  },
  chipText: { color: colors.text, fontFamily: fonts.semi, fontSize: 12 },
  screenTitle: { fontSize: 26, fontFamily: fonts.extra, color: colors.text },
});
