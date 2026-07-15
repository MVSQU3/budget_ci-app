import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, fonts } from '../theme/theme';
import { Card, GradientCard, ScreenTitle } from '../components/UI';
import { useBudget, getCategorie } from '../context/BudgetContext';
import { formatFCFA, formatSigned, formatHeure, moisCourant } from '../utils/format';

export default function AccueilScreen({ navigation }) {
  const { stats, transactions } = useBudget();
  const recentes = transactions.slice(0, 5);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenTitle>Accueil</ScreenTitle>

        {/* Solde — style "Total Balance" des maquettes */}
        <GradientCard style={styles.soldeCard}>
          <Text style={styles.soldeLabel}>Solde total</Text>
          <Text style={styles.soldeMontant}>{formatFCFA(stats.soldeTotal)}</Text>
          <View style={styles.actionsRow}>
            <ActionBouton
              icone="arrow-up" label="Dépense" color={colors.expense}
              onPress={() => navigation.navigate('Saisie', { type: 'depense' })}
            />
            <ActionBouton
              icone="arrow-down" label="Revenu" color={colors.income}
              onPress={() => navigation.navigate('Saisie', { type: 'revenu' })}
            />
            <ActionBouton
              icone="flag" label="Budgets" color={colors.accent}
              onPress={() => navigation.navigate('Budgets')}
            />
          </View>
        </GradientCard>

        {/* Résumé du mois */}
        <Text style={styles.section}>Ce mois — {moisCourant()}</Text>
        <View style={styles.row}>
          <Card style={styles.miniCard}>
            <Text style={styles.miniLabel}>Revenus</Text>
            <Text style={[styles.miniMontant, { color: colors.income }]}>
              {formatFCFA(stats.revenus)}
            </Text>
          </Card>
          <Card style={styles.miniCard}>
            <Text style={styles.miniLabel}>Dépenses</Text>
            <Text style={[styles.miniMontant, { color: colors.expense }]}>
              {formatFCFA(stats.depenses)}
            </Text>
          </Card>
        </View>

        {/* Transactions récentes */}
        <Text style={styles.section}>Récent</Text>
        {recentes.length === 0 ? (
          <Card>
            <Text style={styles.vide}>
              Aucune transaction. Appuie sur « Dépense » ou « Revenu » pour commencer.
            </Text>
          </Card>
        ) : (
          <Card style={{ paddingVertical: 4 }}>
            {recentes.map((t) => {
              const cat = getCategorie(t.categorieId);
              return (
                <View key={t.id} style={styles.txRow}>
                  <View style={[styles.txIcon, { backgroundColor: (cat.couleur || colors.income) + '22' }]}>
                    <Ionicons name={cat.icone} size={18} color={cat.couleur || colors.income} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txNom}>{cat.nom}</Text>
                    <Text style={styles.txHeure}>{formatHeure(t.date)}</Text>
                  </View>
                  <Text style={[styles.txMontant, { color: t.type === 'revenu' ? colors.income : colors.expense }]}>
                    {formatSigned(t.montant, t.type)}
                  </Text>
                </View>
              );
            })}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Boutons ronds blancs avec icône colorée, comme Send/Receive/Buy des maquettes
function ActionBouton({ icone, label, color, onPress }) {
  return (
    <TouchableOpacity style={styles.action} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.actionIcon}>
        <Ionicons name={icone} size={20} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  soldeCard: { marginTop: 16, padding: 20 },
  soldeLabel: { color: colors.textSecondary, fontSize: 13, fontFamily: fonts.semi },
  soldeMontant: { fontSize: 30, fontFamily: fonts.extra, color: colors.text, marginTop: 4 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 18 },
  action: { alignItems: 'center' },
  actionIcon: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', ...shadow,
  },
  actionLabel: { marginTop: 6, fontSize: 12, fontFamily: fonts.semi, color: colors.text },
  section: { fontSize: 16, fontFamily: fonts.extra, color: colors.text, marginTop: 24, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12 },
  miniCard: { flex: 1 },
  miniLabel: { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.semi },
  miniMontant: { fontSize: 16, fontFamily: fonts.extra, marginTop: 4 },
  vide: { color: colors.textSecondary, lineHeight: 20, fontFamily: fonts.regular },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  txIcon: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  txNom: { fontFamily: fonts.bold, color: colors.text, fontSize: 13 },
  txHeure: { color: colors.textSecondary, fontSize: 11, marginTop: 2, fontFamily: fonts.regular },
  txMontant: { fontFamily: fonts.extra, fontSize: 13 },
});
