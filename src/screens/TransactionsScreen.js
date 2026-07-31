import React, { useMemo, useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow, fonts } from '../theme/theme';
import { ScreenTitle, ChipFiltre } from '../components/UI';
import { useBudget, getCategorie } from '../context/BudgetContext';
import { formatSigned, formatDate, formatHeure, formatJour } from '../utils/format';

const FILTRES = [
  { id: 'tout', label: 'Tout' },
  { id: 'jour', label: "Aujourd'hui" },
  { id: '7j', label: '7 jours' },
  { id: 'mois', label: 'Ce mois' },
  { id: 'date', label: 'Date', icone: 'calendar-outline' },
];

const memeJour = (a, b) =>
  a.getDate() === b.getDate() &&
  a.getMonth() === b.getMonth() &&
  a.getFullYear() === b.getFullYear();

// Historique groupé par jour, une carte blanche par transaction
export default function TransactionsScreen() {
  const { transactions, supprimerTransaction, flash } = useBudget();
  const [filtre, setFiltre] = useState('tout');
  const [dateChoisie, setDateChoisie] = useState(new Date());
  const [calendrierOuvert, setCalendrierOuvert] = useState(false);

  const filtrees = useMemo(() => {
    const now = new Date();
    return transactions.filter((t) => {
      const d = new Date(t.date);
      switch (filtre) {
        case 'jour': return memeJour(d, now);
        case '7j': return now - d <= 7 * 24 * 60 * 60 * 1000;
        case 'mois': return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        case 'date': return memeJour(d, dateChoisie);
        default: return true;
      }
    });
  }, [transactions, filtre, dateChoisie]);

  const sections = useMemo(() => {
    const parJour = {};
    filtrees.forEach((t) => {
      const jour = formatJour(t.date);
      (parJour[jour] = parJour[jour] || []).push(t);
    });
    return Object.entries(parJour).map(([title, data]) => ({ title, data }));
  }, [filtrees]);

  const choisirFiltre = (id) => {
    setFiltre(id);
    if (id === 'date') setCalendrierOuvert(true);
  };

  const supprimer = (t) => {
    supprimerTransaction(t.id);
    flash('Transaction supprimée');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
        <ScreenTitle>Transactions</ScreenTitle>
      </View>

      {/* Barre de filtres */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtres}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 4 }}
      >
        {FILTRES.map((f) => (
          <ChipFiltre
            key={f.id}
            label={f.label}
            icone={f.icone}
            active={filtre === f.id}
            onPress={() => choisirFiltre(f.id)}
          />
        ))}
      </ScrollView>

      {/* Jour sélectionné (mode « Date ») */}
      {filtre === 'date' && (
        <TouchableOpacity
          style={styles.selecteurJour}
          onPress={() => setCalendrierOuvert(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={16} color={colors.text} />
          <Text style={styles.dateTexte}>{formatDate(dateChoisie.toISOString())}</Text>
        </TouchableOpacity>
      )}

      {calendrierOuvert && (
        <DateTimePicker
          value={dateChoisie}
          mode="date"
          maximumDate={new Date()}
          onChange={(event, date) => {
            setCalendrierOuvert(false);
            if (event.type !== 'dismissed' && date) setDateChoisie(date);
          }}
        />
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.liste}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.vide}>Aucune transaction sur cette période.</Text>
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.jour}>{section.title}</Text>
        )}
        renderItem={({ item }) => {
          const cat = getCategorie(item.categorieId);
          return (
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: cat.couleur + '26' }]}>
                <Ionicons name={cat.icone} size={19} color={cat.couleur} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.nom}>{cat.nom}</Text>
                <Text style={styles.sous}>
                  {formatHeure(item.date)}{item.note ? ` · ${item.note}` : ''}
                </Text>
              </View>
              <Text
                style={[
                  styles.montant,
                  { color: item.type === 'revenu' ? colors.vert : colors.accentFonce },
                ]}
              >
                {formatSigned(item.montant, item.type)}
              </Text>
              <TouchableOpacity
                onPress={() => supprimer(item)}
                style={styles.supprimer}
                activeOpacity={0.7}
                accessibilityLabel="Supprimer la transaction"
              >
                <Ionicons name="trash" size={13} color={colors.accentLien} />
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  filtres: { flexGrow: 0, marginTop: 14 },
  selecteurJour: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'center', marginTop: 10, paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 999, backgroundColor: colors.card, ...shadow,
  },
  dateTexte: { fontFamily: fonts.bold, color: colors.text, fontSize: 14 },
  liste: { paddingHorizontal: 20, paddingBottom: 130 },
  jour: {
    color: colors.textMuted, fontFamily: fonts.extra, fontSize: 12.5,
    marginTop: 18, marginBottom: 9,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: 20,
    paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8, ...shadow,
  },
  icon: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  nom: { fontFamily: fonts.bold, color: colors.text, fontSize: 13.5 },
  sous: { color: colors.textMuted, fontSize: 11, marginTop: 2, fontFamily: fonts.regular },
  montant: { fontFamily: fonts.extra, fontSize: 13 },
  supprimer: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: colors.cardSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  vide: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 60, fontFamily: fonts.regular },
});
