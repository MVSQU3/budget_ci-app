import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadow } from '../theme/theme';
import { useLicence } from '../context/LicenceContext';

/**
 * Bandeau d'état d'abonnement.
 *
 * Ne s'affiche que quand il y a quelque chose à dire : période échue (tolérance)
 * ou abonnement expiré. Un abonnement actif n'affiche rien — pas de bruit permanent.
 */
export default function BandeauLicence({ style }) {
  const { licence } = useLicence();

  if (licence.raison === 'tolerance') {
    return (
      <View style={[styles.bandeau, styles.alerte, style]}>
        <Ionicons name="time-outline" size={18} color={colors.accentFonce} />
        <Text style={[styles.texte, { color: colors.accentFonce }]}>
          Ton abonnement est échu. Tu peux encore saisir quelques jours —
          connecte-toi pour le renouveler.
        </Text>
      </View>
    );
  }

  if (licence.raison === 'expiree') {
    return (
      <View style={[styles.bandeau, styles.expire, style]}>
        <Ionicons name="lock-closed" size={18} color={colors.surAccent} />
        <Text style={[styles.texte, { color: colors.surAccent }]}>
          Abonnement expiré — saisie bloquée. Tes données restent intactes et
          consultables ; renouvelle pour enregistrer à nouveau.
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  bandeau: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 20,
    paddingVertical: 13,
    paddingHorizontal: 15,
    ...shadow,
  },
  alerte: { backgroundColor: colors.peche },
  expire: { backgroundColor: colors.accentFonce },
  texte: { flex: 1, fontSize: 12.5, lineHeight: 17, fontFamily: fonts.semi },
});
