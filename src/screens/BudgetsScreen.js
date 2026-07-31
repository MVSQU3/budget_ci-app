import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Pressable, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow, shadowForte, fonts } from '../theme/theme';
import { ScreenTitle, Bouton, Card } from '../components/UI';
import { useBudget, CATEGORIES } from '../context/BudgetContext';
import { formatFCFA, moisCourant } from '../utils/format';

export default function BudgetsScreen() {
  const { budgets, stats, definirBudget, flash } = useBudget();
  const [modal, setModal] = useState(null); // catégorie en cours d'édition
  const [saisie, setSaisie] = useState('');

  const ouvrir = (cat) => {
    setSaisie(budgets[cat.id] ? String(budgets[cat.id]) : '');
    setModal(cat);
  };

  const enregistrer = () => {
    definirBudget(modal.id, saisie);
    flash(`Budget « ${modal.nom} » mis à jour`);
    setModal(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenTitle>Budgets</ScreenTitle>
        <Text style={styles.sousTitre}>Limites mensuelles — {moisCourant()}</Text>

        <View style={{ gap: 10, marginTop: 16 }}>
          {CATEGORIES.map((cat) => {
            const limite = budgets[cat.id] || 0;
            const depense = stats.parCategorie[cat.id] || 0;
            const ratio = limite > 0 ? Math.min(depense / limite, 1) : 0;
            const depasse = limite > 0 && depense > limite;
            const proche = limite > 0 && !depasse && depense >= limite * 0.8;

            return (
              <TouchableOpacity key={cat.id} onPress={() => ouvrir(cat)} activeOpacity={0.8}>
                <Card style={styles.ligne}>
                  <View style={styles.entete}>
                    <View style={styles.gauche}>
                      <Ionicons name={cat.icone} size={17} color={cat.couleur} />
                      <Text style={styles.nom}>{cat.nom}</Text>
                    </View>
                    <Text style={styles.chiffres}>
                      {limite > 0
                        ? `${formatFCFA(depense)} / ${formatFCFA(limite)}`
                        : 'Définir un budget'}
                    </Text>
                  </View>

                  <View style={styles.barreFond}>
                    <View
                      style={[
                        styles.barre,
                        {
                          width: `${ratio * 100}%`,
                          backgroundColor: depasse
                            ? colors.accentFonce
                            : proche
                            ? colors.warning
                            : cat.couleur,
                        },
                      ]}
                    />
                  </View>

                  {depasse && (
                    <Text style={[styles.alerte, { color: colors.accentFonce }]}>
                      Dépassé de {formatFCFA(depense - limite)}
                    </Text>
                  )}
                  {proche && (
                    <Text style={[styles.alerte, { color: colors.accentLien }]}>
                      Attention : plus de 80 % utilisé
                    </Text>
                  )}
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Édition du budget d'une catégorie */}
      <Modal visible={!!modal} transparent animationType="fade" onRequestClose={() => setModal(null)}>
        <View style={styles.modalFond}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModal(null)} />
          <View style={styles.modalCarte}>
            <Text style={styles.modalTitre}>Budget « {modal?.nom} »</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Montant mensuel en FCFA"
              placeholderTextColor={colors.textGhost}
              value={saisie}
              onChangeText={(v) => setSaisie(v.replace(/[^0-9]/g, ''))}
              autoFocus
            />
            <Bouton title="Enregistrer" onPress={enregistrer} style={{ paddingVertical: 15 }} />
            <TouchableOpacity onPress={() => setModal(null)}>
              <Text style={styles.annuler}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 130 },
  sousTitre: { color: colors.textSecondary, marginTop: 4, fontSize: 12.5, fontFamily: fonts.semi },
  ligne: { borderRadius: 22, paddingVertical: 15, paddingHorizontal: 16 },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  gauche: { flexDirection: 'row', alignItems: 'center', gap: 9, flexShrink: 1 },
  nom: { fontFamily: fonts.bold, color: colors.text, fontSize: 13.5 },
  chiffres: { color: colors.textSecondary, fontSize: 11.5, fontFamily: fonts.bold },
  barreFond: {
    height: 9, backgroundColor: colors.border, borderRadius: 999,
    marginTop: 11, overflow: 'hidden',
  },
  barre: { height: '100%', borderRadius: 999 },
  alerte: { fontSize: 11.5, fontFamily: fonts.bold, marginTop: 8 },
  modalFond: {
    flex: 1, backgroundColor: 'rgba(32,30,29,0.45)',
    justifyContent: 'center', paddingHorizontal: 24,
  },
  modalCarte: {
    backgroundColor: colors.background, borderRadius: 28, padding: 22, gap: 14, ...shadowForte,
  },
  modalTitre: { fontFamily: fonts.display, fontSize: 19, color: colors.text },
  input: {
    backgroundColor: colors.card, borderRadius: 999,
    paddingHorizontal: 20, paddingVertical: 15,
    fontSize: 15, color: colors.text, fontFamily: fonts.semi, ...shadow,
  },
  annuler: { textAlign: 'center', color: colors.textSecondary, fontSize: 13, fontFamily: fonts.bold },
});
