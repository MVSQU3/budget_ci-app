import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme/theme';

// Pavé numérique du design : grille 3 colonnes, touches à grands coins arrondis
const TOUCHES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];

export default function Pave({ onKey, touches = TOUCHES, hauteur = 56, taille = 26 }) {
  return (
    <View style={styles.grid}>
      {touches.map((k, i) => (
        <TouchableOpacity
          key={`${k}-${i}`}
          style={[styles.key, { height: hauteur }]}
          onPress={() => k && onKey(k)}
          disabled={!k}
          activeOpacity={0.6}
        >
          <Text style={[styles.keyText, { fontSize: k === '000' ? taille - 6 : taille }]}>{k}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  key: {
    width: '33.33%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  keyText: { fontFamily: fonts.semi, color: colors.text },
});
