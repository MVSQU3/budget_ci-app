import React, { useMemo } from 'react';
import { View, Text, SectionList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, shadow } from '../theme/theme';
import { ScreenTitle } from '../components/UI';
import { useBudget, getCategorie } from '../context/BudgetContext';
import { formatSigned, formatDate, formatHeure } from '../utils/format';

// Historique groupé par jour — style "Total Wallet Value > History" des maquettes
export default function TransactionsScreen() {
  const { transactions, supprimerTransaction } = useBudget();

  const sections = useMemo(() => {
    const parJour = {};
    transactions.forEach((t) => {
      const jour = formatDate(t.date);
      (parJour[jour] = parJour[jour] || []).push(t);
    });
    return Object.entries(parJour).map(([title, data]) => ({ title, data }));
  }, [transactions]);

  const confirmerSuppression = (t) => {
    Alert.alert('Supprimer', 'Supprimer cette transaction ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => supprimerTransaction(t.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={{ padding: 20, paddingBottom: 8 }}>
        <ScreenTitle>Transactions</ScreenTitle>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={styles.vide}>Aucune transaction pour le moment.</Text>
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.jour}>{section.title}</Text>
        )}
        renderItem={({ item }) => {
          const cat = getCategorie(item.categorieId);
          return (
            <TouchableOpacity
              style={styles.row}
              onLongPress={() => confirmerSuppression(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.icon, { backgroundColor: (cat.couleur || colors.income) + '22' }]}>
                <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nom}>{cat.nom}</Text>
                <Text style={styles.sous}>
                  {formatHeure(item.date)}{item.note ? ` · ${item.note}` : ''}
                </Text>
              </View>
              <Text style={[styles.montant, { color: item.type === 'revenu' ? colors.income : colors.expense }]}>
                {formatSigned(item.montant, item.type)}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
      {transactions.length > 0 && (
        <Text style={styles.astuce}>Appui long sur une ligne pour supprimer</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  jour: { color: colors.textSecondary, fontWeight: '700', fontSize: 13, marginTop: 16, marginBottom: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 16, padding: 12, marginBottom: 8, ...shadow,
  },
  icon: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  nom: { fontWeight: '700', color: colors.text, fontSize: 14 },
  sous: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  montant: { fontWeight: '800', fontSize: 14 },
  vide: { color: colors.textSecondary, marginTop: 24, textAlign: 'center' },
  astuce: { textAlign: 'center', color: colors.textSecondary, fontSize: 11, paddingBottom: 8 },
});
