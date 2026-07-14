import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/theme';

// Pavé numérique inspiré de l'écran "Amount" des maquettes
const TOUCHES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];

export default function Pave({ onKey }) {
  return (
    <View style={styles.grid}>
      {TOUCHES.map((k) => (
        <TouchableOpacity key={k} style={styles.key} onPress={() => onKey(k)} activeOpacity={0.6}>
          <Text style={[styles.keyText, k === '000' && { fontSize: 18 }]}>{k}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  key: {
    width: '33.33%',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { fontSize: 26, fontWeight: '600', color: colors.text },
});
