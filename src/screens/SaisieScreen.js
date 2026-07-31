import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, shadow, fonts } from '../theme/theme';
import { Bouton, Chip, BoutonRond } from '../components/UI';
import Pave from '../components/Pave';
import { useBudget, getCategorie, CATEGORIES, SOURCES_REVENU } from '../context/BudgetContext';
import { formatFCFA } from '../utils/format';

// Feuille de saisie : bascule dépense/revenu, montant en gros, catégories, pavé
export default function SaisieScreen({ route, navigation }) {
  const typeInitial = route.params?.type || 'depense';
  const [type, setType] = useState(typeInitial);
  const [montant, setMontant] = useState('');
  const [categorieId, setCategorieId] = useState(null);
  const [note, setNote] = useState('');
  const { ajouterTransaction, budgets, stats, flash } = useBudget();

  const listeCategories = type === 'depense' ? CATEGORIES : SOURCES_REVENU;
  const montantNum = Number(montant || 0);
  const pret = !!montant && !!categorieId;

  const onKey = (k) => {
    if (k === '⌫') return setMontant((m) => m.slice(0, -1));
    if (k === '000') return setMontant((m) => (m ? m + '000' : m));
    setMontant((m) => (m.length < 10 ? m + k : m));
  };

  const changerType = (t) => {
    setType(t);
    setCategorieId(null);
  };

  const valider = () => {
    if (!pret) return flash('Choisis un montant et une catégorie');
    ajouterTransaction({ type, montant: montantNum, categorieId, note });

    const limite = budgets[categorieId] || 0;
    const apres = (stats.parCategorie[categorieId] || 0) + montantNum;
    if (type === 'depense' && limite && apres > limite) {
      flash(
        `⚠ Budget « ${getCategorie(categorieId).nom} » dépassé de ${formatFCFA(apres - limite)}`,
      );
    } else {
      flash(`${formatFCFA(montantNum)} enregistré`);
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* En-tête */}
      <View style={styles.header}>
        <BoutonRond icone="close" taille={40} onPress={() => navigation.goBack()} />
        <Text style={styles.titre}>Montant</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Bascule dépense / revenu */}
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, type === 'depense' && { backgroundColor: colors.accent }]}
          onPress={() => changerType('depense')}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, type === 'depense' && { color: colors.surAccent }]}>
            Dépense
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, type === 'revenu' && { backgroundColor: colors.vert }]}
          onPress={() => changerType('revenu')}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, type === 'revenu' && { color: colors.surVert }]}>
            Revenu
          </Text>
        </TouchableOpacity>
      </View>

      {/* Montant */}
      <Text
        style={[
          styles.montant,
          { fontSize: montant.length > 7 ? 28 : 36, color: montant ? colors.text : colors.textGhost },
        ]}
      >
        {montant ? formatFCFA(montantNum) : '0 FCFA'}
      </Text>

      {/* Catégories */}
      <ScrollView style={styles.zoneChips} contentContainerStyle={styles.chips}>
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
      </ScrollView>

      {/* Note facultative */}
      <TextInput
        style={styles.note}
        placeholder="Note (facultatif)"
        placeholderTextColor={colors.textGhost}
        value={note}
        onChangeText={setNote}
      />

      <Pave onKey={onKey} />

      <View style={styles.pied}>
        <Bouton
          title={type === 'revenu' ? 'Ajouter le revenu' : 'Ajouter la dépense'}
          onPress={valider}
          disabled={!pret}
          variante={type === 'revenu' ? 'vert' : 'accent'}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12,
  },
  titre: { fontFamily: fonts.display, fontSize: 18, color: colors.text },
  toggle: {
    flexDirection: 'row', backgroundColor: colors.card, borderRadius: 999,
    padding: 4, marginHorizontal: 20, marginTop: 16, ...shadow,
  },
  toggleBtn: { flex: 1, paddingVertical: 11, borderRadius: 999, alignItems: 'center' },
  toggleText: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.textMuted },
  montant: {
    textAlign: 'center', fontFamily: fonts.display,
    paddingTop: 22, paddingBottom: 16, paddingHorizontal: 20,
  },
  zoneChips: { flexGrow: 0, maxHeight: 96 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20 },
  note: {
    backgroundColor: colors.card, borderRadius: 999,
    marginHorizontal: 20, marginTop: 12,
    paddingHorizontal: 18, paddingVertical: 12,
    fontSize: 13.5, color: colors.text, fontFamily: fonts.regular, ...shadow,
  },
  pied: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 26, marginTop: 'auto' },
});
