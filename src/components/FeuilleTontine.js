import React from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadow } from '../theme/theme';
import { Bouton } from './UI';
import { TONTINE } from '../context/BudgetContext';
import { formatFCFA } from '../utils/format';

/** Feuille du bas « Tontine du quartier » : épargne, jauge, paliers, cotisation. */
export default function FeuilleTontine({ visible, onClose, tontine, onCotiser, lectureSeule }) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.fond}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[styles.feuille, { paddingBottom: 30 + insets.bottom }]}>
          <View style={styles.poignee} />

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.titre}>{TONTINE.nom}</Text>
            {/* <Text style={styles.sous}>
              Cotisation de {formatFCFA(TONTINE.cotisation)} chaque {TONTINE.jour} ·{' '}
              {TONTINE.membres} membres
            </Text> */}

            {/* Bloc vert olive : épargne et jauge */}
            <View style={styles.bloc}>
              <View style={styles.blocEntete}>
                <Text style={styles.blocLabel}>Épargné</Text>
                <Text style={styles.blocLabel}>Objectif {formatFCFA(tontine.objectif)}</Text>
              </View>
              <Text style={styles.blocMontant}>{formatFCFA(tontine.epargne)}</Text>
              <View style={styles.jaugeFond}>
                <View style={[styles.jauge, { width: `${tontine.ratio * 100}%` }]} />
              </View>
              <Text style={styles.blocPied}>
                Ton tour de main : <Text style={styles.gras}>{TONTINE.prochainTour}</Text>
              </Text>
            </View>

            <Text style={styles.titrePaliers}>Paliers</Text>
            <View style={{ gap: 9 }}>
              {tontine.paliers.map((p) => (
                <View key={p.titre} style={styles.palier}>
                  <Ionicons
                    name={p.atteint ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={p.atteint ? colors.vertMoyen : colors.textGhost}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.palierTitre}>{p.titre}</Text>
                    <Text style={styles.palierSous}>{p.sous}</Text>
                  </View>
                  <Text
                    style={[
                      styles.badge,
                      p.atteint
                        ? { backgroundColor: colors.vertBadge, color: colors.vert }
                        : { backgroundColor: colors.border, color: colors.textMuted },
                    ]}
                  >
                    {p.atteint ? 'Atteint' : 'À venir'}
                  </Text>
                </View>
              ))}
            </View>

            <Bouton
              title={
                lectureSeule
                  ? 'Abonnement expiré — saisie bloquée'
                  : 'Enregistrer la cotisation de cette semaine'
              }
              onPress={onCotiser}
              disabled={lectureSeule}
              style={{ marginTop: 18 }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1, backgroundColor: 'rgba(32,30,29,0.45)', justifyContent: 'flex-end' },
  feuille: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingHorizontal: 22,
    paddingTop: 22,
    maxHeight: '78%',
  },
  poignee: {
    width: 44, height: 5, borderRadius: 999,
    backgroundColor: colors.borderFort, alignSelf: 'center', marginBottom: 16,
  },
  titre: { fontFamily: fonts.display, fontSize: 23, color: colors.text },
  sous: { fontSize: 13, color: colors.textSecondary, marginTop: 4, fontFamily: fonts.regular },
  bloc: { backgroundColor: colors.vert, borderRadius: 26, padding: 18, marginTop: 16 },
  blocEntete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  blocLabel: { fontSize: 12, color: colors.surVert, opacity: 0.85, fontFamily: fonts.bold },
  blocMontant: { fontFamily: fonts.display, fontSize: 30, color: colors.surVert, marginTop: 4 },
  jaugeFond: {
    height: 11, borderRadius: 999, marginTop: 12, overflow: 'hidden',
    backgroundColor: 'rgba(240,250,225,0.2)',
  },
  jauge: { height: '100%', borderRadius: 999, backgroundColor: colors.accentClair },
  blocPied: { fontSize: 12, color: colors.surVert, opacity: 0.85, marginTop: 9, fontFamily: fonts.regular },
  gras: { fontFamily: fonts.extra },
  titrePaliers: { fontFamily: fonts.extra, fontSize: 14, color: colors.text, marginTop: 18, marginBottom: 10 },
  palier: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: 20,
    paddingVertical: 13, paddingHorizontal: 15, ...shadow,
  },
  palierTitre: { fontSize: 13.5, fontFamily: fonts.bold, color: colors.text },
  palierSous: { fontSize: 11.5, color: colors.textMuted, marginTop: 2, fontFamily: fonts.regular },
  badge: {
    fontSize: 11, fontFamily: fonts.extra, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 5, overflow: 'hidden',
  },
});
