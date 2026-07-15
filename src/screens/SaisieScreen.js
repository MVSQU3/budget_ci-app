import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/theme';
import { DarkButton, Chip } from '../components/UI';
import Pave from '../components/Pave';
import { useBudget, CATEGORIES, SOURCES_REVENU } from '../context/BudgetContext';
import { formatFCFA } from '../utils/format';

// Écran de saisie inspiré de l'écran "Amount" des maquettes (montant + pavé numérique)
export default function SaisieScreen({ route, navigation }) {
  const typeInitial = route.params?.type || 'depense';
  const [type, setType] = useState(typeInitial);
  const [montant, setMontant] = useState('');
  const [categorieId, setCategorieId] = useState(null);
  const [note, setNote] = useState('');
  const { ajouterTransaction } = useBudget();

  const listeCategories = type === 'depense' ? CATEGORIES : SOURCES_REVENU;

  const onKey = (k) => {
    if (k === '⌫') return setMontant((m) => m.slice(0, -1));
    if (k === '000') return setMontant((m) => (m ? m + '000' : m));
    setMontant((m) => (m.length < 10 ? m + k : m));
  };

  const valider = () => {
    if (!montant || !categorieId) return;
    ajouterTransaction({ type, montant, categorieId, note });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.titre}>Montant</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Bascule dépense / revenu */}
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, type === 'depense' && { backgroundColor: colors.expense }]}
            onPress={() => { setType('depense'); setCategorieId(null); }}
          >
            <Text style={[styles.toggleText, type === 'depense' && { color: '#fff' }]}>Dépense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, type === 'revenu' && { backgroundColor: colors.income }]}
            onPress={() => { setType('revenu'); setCategorieId(null); }}
          >
            <Text style={[styles.toggleText, type === 'revenu' && { color: '#fff' }]}>Revenu</Text>
          </TouchableOpacity>
        </View>

        {/* Montant */}
        <Text style={styles.montant}>
          {montant ? formatFCFA(montant) : '0 FCFA'}
        </Text>

        {/* Catégories */}
        <View style={styles.chips}>
          {listeCategories.map((c) => (
            <Chip
              key={c.id}
              label={c.nom}
              icone={c.icone}
              active={categorieId === c.id}
              color={c.couleur}
              onPress={() => setCategorieId(c.id)}
            />
          ))}
        </View>

        {/* Note optionnelle */}
        <TextInput
          style={styles.note}
          placeholder="Note (facultatif)"
          placeholderTextColor={colors.textSecondary}
          value={note}
          onChangeText={setNote}
        />

        <Pave onKey={onKey} />

        <DarkButton
          title={type === 'depense' ? 'Ajouter la dépense' : 'Ajouter le revenu'}
          onPress={valider}
          disabled={!montant || !categorieId}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  titre: { fontSize: 18, fontWeight: '800', color: colors.text },
  toggle: {
    flexDirection: 'row', backgroundColor: colors.card, borderRadius: 26,
    padding: 4, marginTop: 20,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 22, alignItems: 'center' },
  toggleText: { fontWeight: '700', color: colors.textSecondary },
  montant: {
    fontSize: 36, fontWeight: '800', color: colors.text,
    textAlign: 'center', marginVertical: 20,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  note: {
    backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 16,
    paddingVertical: 12, marginTop: 8, marginBottom: 8, color: colors.text,
  },
});
