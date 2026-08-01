import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow, shadowMoyenne, fonts } from '../theme/theme';
import { Card, GradientCard, ScreenTitle, TitreSection, ActionRonde } from '../components/UI';
import AnneauTontine from '../components/AnneauTontine';
import FeuilleTontine from '../components/FeuilleTontine';
import BandeauLicence from '../components/BandeauLicence';
import { useBudget, getCategorie } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext';
import { formatFCFA, formatSigned, formatHeure, moisCourant } from '../utils/format';

const salutation = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 17) return 'Bon après-midi';
  return 'Bonsoir';
};

export default function AccueilScreen({ navigation }) {
  const { stats, transactions, tontine, cotiserTontine, lectureSeule, flash } = useBudget();
  const { utilisateur } = useAuth();
  const [tontineOuverte, setTontineOuverte] = useState(false);
  const recentes = transactions.slice(0, 5);

  // Consulter reste toujours possible ; seule la saisie est verrouillée
  const ouvrirSaisie = (type) =>
    lectureSeule
      ? flash('Abonnement expiré — renouvelle pour enregistrer à nouveau')
      : navigation.navigate('Saisie', { type });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* En-tête : salutation + cloche de notifications */}
        <View style={styles.entete}>
          <View>
            <Text style={styles.salut}>
              {salutation()} {utilisateur?.nomUtilisateur || ''}
            </Text>
            <ScreenTitle>Accueil</ScreenTitle>
          </View>
          <View style={styles.cloche}>
            <Ionicons name="notifications" size={19} color={colors.text} />
            <View style={styles.pastilleCloche} />
          </View>
        </View>

        <BandeauLicence style={{ marginTop: 16 }} />

        {/* Solde total + raccourcis */}
        <GradientCard style={{ marginTop: 18 }}>
          <Text style={styles.soldeLabel}>Solde total</Text>
          <Text style={styles.soldeMontant}>{formatFCFA(stats.soldeTotal)}</Text>
          <View style={styles.actionsRow}>
            <ActionRonde
              icone={lectureSeule ? 'lock-closed' : 'arrow-up'}
              label="Dépense"
              color={lectureSeule ? colors.textFaint : colors.accentFonce}
              onPress={() => ouvrirSaisie('depense')}
            />
            <ActionRonde
              icone={lectureSeule ? 'lock-closed' : 'arrow-down'}
              label="Revenu"
              color={lectureSeule ? colors.textFaint : colors.vert}
              onPress={() => ouvrirSaisie('revenu')}
            />
            <ActionRonde
              icone="flag" label="Budgets" color={colors.vertClair}
              onPress={() => navigation.navigate('Budgets')}
            />
          </View>
        </GradientCard>

        {/* Tontine : objectif suivi, en 2ᵉ place comme dans le design */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setTontineOuverte(true)}
          style={styles.tontine}
        >
          <View style={styles.tontineBlob} pointerEvents="none" />
          <AnneauTontine ratio={tontine.ratio} pourcentage={tontine.pourcentage} />
          <View style={{ flex: 1 }}>
            <Text style={styles.tontineSurtitre}>Tontine du quartier</Text>
            <Text style={styles.tontineMontant}>{formatFCFA(tontine.epargne)}</Text>
            <Text style={styles.tontineDetail}>
              sur {formatFCFA(tontine.objectif)} · {formatFCFA(tontine.reste)} restants
            </Text>
            <View style={styles.serie}>
              <Ionicons name="flame" size={13} color={colors.accentClair} />
              <Text style={styles.serieTexte}>{tontine.serie} semaines d'affilée</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Résumé du mois */}
        <View style={styles.enteteSection}>
          <TitreSection>Ce mois</TitreSection>
          <Text style={styles.moisLabel}>{moisCourant()}</Text>
        </View>
        <View style={styles.row}>
          <Card style={styles.miniCard}>
            <Text style={styles.miniLabel}>Revenus</Text>
            <Text style={[styles.miniMontant, { color: colors.vert }]}>
              {formatFCFA(stats.revenus)}
            </Text>
          </Card>
          <Card style={styles.miniCard}>
            <Text style={styles.miniLabel}>Dépenses</Text>
            <Text style={[styles.miniMontant, { color: colors.accentFonce }]}>
              {formatFCFA(stats.depenses)}
            </Text>
          </Card>
        </View>

        {/* Transactions récentes */}
        <View style={styles.enteteSection}>
          <TitreSection>Récent</TitreSection>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.toutVoir}>Tout voir</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.listeRecente}>
          {recentes.length === 0 ? (
            <Text style={styles.vide}>
              Aucune transaction. Appuie sur « Dépense » ou « Revenu » pour commencer.
            </Text>
          ) : (
            recentes.map((t) => {
              const cat = getCategorie(t.categorieId);
              return (
                <View key={t.id} style={styles.txRow}>
                  <View style={[styles.txIcon, { backgroundColor: cat.couleur + '26' }]}>
                    <Ionicons name={cat.icone} size={19} color={cat.couleur} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.txNom}>{cat.nom}</Text>
                    <Text style={styles.txHeure}>
                      {formatHeure(t.date)}{t.note ? ` · ${t.note}` : ''}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.txMontant,
                      { color: t.type === 'revenu' ? colors.vert : colors.accentFonce },
                    ]}
                  >
                    {formatSigned(t.montant, t.type)}
                  </Text>
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>

      <FeuilleTontine
        visible={tontineOuverte}
        onClose={() => setTontineOuverte(false)}
        tontine={tontine}
        lectureSeule={lectureSeule}
        onCotiser={() => {
          setTontineOuverte(false);
          cotiserTontine();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 130 },
  entete: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  salut: { fontSize: 13, color: colors.textSecondary, fontFamily: fonts.semi },
  cloche: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center', ...shadow,
  },
  pastilleCloche: {
    position: 'absolute', top: 9, right: 10, width: 9, height: 9, borderRadius: 5,
    backgroundColor: colors.accent, borderWidth: 2, borderColor: '#fff',
  },

  soldeLabel: { fontSize: 12.5, fontFamily: fonts.bold, color: colors.textSecondary },
  soldeMontant: { fontFamily: fonts.display, fontSize: 34, color: colors.text, marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 18 },

  tontine: {
    marginTop: 14, borderRadius: 28, padding: 20,
    backgroundColor: colors.vert, flexDirection: 'row', gap: 18,
    alignItems: 'center', overflow: 'hidden', ...shadowMoyenne,
  },
  tontineBlob: {
    position: 'absolute', width: 170, height: 170, borderRadius: 85,
    backgroundColor: 'rgba(240,250,225,0.07)', bottom: -90, right: -40,
  },
  tontineSurtitre: {
    fontSize: 11.5, letterSpacing: 0.7, textTransform: 'uppercase',
    color: colors.surVert, opacity: 0.8, fontFamily: fonts.bold,
  },
  tontineMontant: { fontFamily: fonts.display, fontSize: 19, color: colors.surVert, marginTop: 3 },
  tontineDetail: { fontSize: 12, color: colors.surVert, opacity: 0.85, marginTop: 3, fontFamily: fonts.regular },
  serie: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 9,
    alignSelf: 'flex-start', borderRadius: 999,
    backgroundColor: 'rgba(240,250,225,0.16)', paddingHorizontal: 11, paddingVertical: 5,
  },
  serieTexte: { fontSize: 11.5, color: colors.surVert, fontFamily: fonts.bold },

  enteteSection: {
    flexDirection: 'row', alignItems: 'baseline',
    justifyContent: 'space-between', marginTop: 24, marginBottom: 12,
  },
  moisLabel: { fontSize: 12, color: colors.textSecondary, fontFamily: fonts.semi },
  toutVoir: { fontSize: 12.5, color: colors.accentLien, fontFamily: fonts.bold },

  row: { flexDirection: 'row', gap: 12 },
  miniCard: { flex: 1, borderRadius: 22 },
  miniLabel: { fontSize: 11.5, color: colors.textSecondary, fontFamily: fonts.bold },
  miniMontant: { fontSize: 17, fontFamily: fonts.extra, marginTop: 4 },

  listeRecente: { borderRadius: 24, paddingVertical: 6, paddingHorizontal: 16 },
  vide: { color: colors.textMuted, fontSize: 13, lineHeight: 19, paddingVertical: 12, fontFamily: fonts.regular },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  txIcon: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  txNom: { fontFamily: fonts.bold, color: colors.text, fontSize: 13.5 },
  txHeure: { color: colors.textMuted, fontSize: 11, marginTop: 2, fontFamily: fonts.regular },
  txMontant: { fontFamily: fonts.extra, fontSize: 13 },
});
