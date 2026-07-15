import React, { useMemo, useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../theme/theme';
import { ScreenTitle } from '../components/UI';
import { useBudget, getCategorie } from '../context/BudgetContext';
import { formatSigned, formatDate, formatHeure } from '../utils/format';

// Filtres disponibles
const FILTRES = [
  { id: 'tout', label: 'Tout' },
  { id: 'jour', label: "Aujourd'hui" },
  { id: '7j', label: '7 jours' },
  { id: 'mois', label: 'Ce mois' },
  { id: 'date', label: 'Date' },
];

const memeJour = (a, b) =>
  a.getDate() === b.getDate() &&
  a.getMonth() === b.getMonth() &&
  a.getFullYear() === b.getFullYear();

// Historique groupé par jour — style "Total Wallet Value > History" des maquettes
export default function TransactionsScreen() {
  const { transactions, supprimerTransaction } = useBudget();
  const [filtre, setFiltre] = useState('tout');
  // Date sélectionnée pour le mode « Date » (choisie via le calendrier natif)
  const [dateChoisie, setDateChoisie] = useState(new Date());
  const [calendrierOuvert, setCalendrierOuvert] = useState(false);

  const filtrees = useMemo(() => {
    const now = new Date();
    return transactions.filter((t) => {
      const d = new Date(t.date);
      switch (filtre) {
        case 'jour':
          return memeJour(d, now);
        case '7j':
          return now - d <= 7 * 24 * 60 * 60 * 1000;
        case 'mois':
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        case 'date':
          return memeJour(d, dateChoisie);
        default:
          return true;
      }
    });
  }, [transactions, filtre, dateChoisie]);

  const sections = useMemo(() => {
    const parJour = {};
    filtrees.forEach((t) => {
      const jour = formatDate(t.date);
      (parJour[jour] = parJour[jour] || []).push(t);
    });
    return Object.entries(parJour).map(([title, data]) => ({ title, data }));
  }, [filtrees]);

  const choisirFiltre = (id) => {
    setFiltre(id);
    if (id === 'date') setCalendrierOuvert(true); // ouvre le calendrier natif
  };

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

      {/* Barre de filtres */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtres}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        {FILTRES.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filtre, filtre === f.id && styles.filtreActif]}
            onPress={() => choisirFiltre(f.id)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              {f.id === 'date' && (
                <Ionicons name="calendar-outline" size={14} color={filtre === f.id ? '#fff' : colors.text} />
              )}
              <Text style={[styles.filtreText, filtre === f.id && { color: '#fff' }]}>
                {f.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Date choisie (mode Date) — tape dessus pour rouvrir le calendrier */}
      {filtre === 'date' && (
        <TouchableOpacity
          style={styles.selecteurJour}
          onPress={() => setCalendrierOuvert(true)}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="calendar-outline" size={16} color={colors.text} />
            <Text style={styles.dateTexte}>{formatDate(dateChoisie.toISOString())}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Calendrier natif */}
      {calendrierOuvert && (
        <DateTimePicker
          value={dateChoisie}
          mode="date"
          maximumDate={new Date()}
          onChange={(event, date) => {
            setCalendrierOuvert(false); // Android : le picker se ferme après le choix
            if (event.type !== 'dismissed' && date) setDateChoisie(date);
          }}
        />
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={styles.vide}>Aucune transaction sur cette période.</Text>
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
                <Ionicons name={cat.icone} size={18} color={cat.couleur || colors.income} />
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
      {filtrees.length > 0 && (
        <Text style={styles.astuce}>Appui long sur une ligne pour supprimer</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  filtres: { flexGrow: 0, marginBottom: 4 },
  filtre: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18,
    backgroundColor: colors.card, marginRight: 8, ...shadow,
  },
  filtreActif: { backgroundColor: colors.dark },
  filtreText: { fontWeight: '600', fontSize: 13, color: colors.text },
  selecteurJour: {
    alignSelf: 'center', marginTop: 8, paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 18, backgroundColor: colors.card, ...shadow,
  },
  dateTexte: { fontWeight: '700', color: colors.text, fontSize: 14, textAlign: 'center' },
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
