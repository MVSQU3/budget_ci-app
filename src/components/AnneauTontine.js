import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { fonts } from '../theme/theme';

const R = 56;              // rayon dans le viewBox 128 du design
const CIRCONFERENCE = 352; // 2πr arrondi, comme le stroke-dasharray du design

/** Anneau de progression de la tontine (piste translucide + arc terracotta clair). */
export default function AnneauTontine({
  ratio,
  pourcentage,
  taille = 86,
  piste = 'rgba(240,250,225,0.22)',
  arc = '#f6a06b',
  couleurTexte = '#f0fae1',
  tailleTexte = 19,
}) {
  const offset = CIRCONFERENCE - CIRCONFERENCE * Math.min(Math.max(ratio, 0), 1);

  return (
    <View style={{ width: taille, height: taille }}>
      <Svg width={taille} height={taille} viewBox="0 0 128 128">
        <Circle cx={64} cy={64} r={R} fill="none" stroke={piste} strokeWidth={13} />
        <Circle
          cx={64}
          cy={64}
          r={R}
          fill="none"
          stroke={arc}
          strokeWidth={13}
          strokeLinecap="round"
          strokeDasharray={CIRCONFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 64 64)"
        />
      </Svg>
      <View style={styles.centre} pointerEvents="none">
        <Text style={{ fontFamily: fonts.display, fontSize: tailleTexte, color: couleurTexte }}>
          {pourcentage}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centre: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
