import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, shadow } from '../theme/theme';
import { ScreenTitle, DarkButton, Card } from '../components/UI';
import { useBudget, CATEGORIES } from '../context/BudgetContext';
import { formatFCFA, moisCourant } from '../utils/format';

export default function BudgetsScreen() {
  const { budgets, stats, definirBudget } = useBudget();
  const [modal, setModal] = useState(null); // catégorie en cours d'édition
  const [saisie, setSaisie] = useState('');

  const ouvrir = (cat) => {
    setSaisie(budgets[cat.id] ? String(budgets[cat.id]) : '');
    setModal(cat);
  };

  const enregistrer = () => {
    definirBudget(modal.id, saisie);
    setModal(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenTitle>Budgets</ScreenTitle>
        <Text style={styles.sousTitre}>Limites mensuelles — {moisCourant()}</Text>

        {CATEGORIES.map((cat) => {
          const limite = budgets[cat.id] || 0;
          const depense = stats.parCategorie[cat.id] || 0;
          const ratio = limite > 0 ? Math.min(depense / limite, 1) : 0;
          const depasse = limite > 0 && depense > limite;
          const proche = limite > 0 && !depasse && depense >= limite * 0.8;

          return (
            <TouchableOpacity key={cat.id} onPress={() => ouvrir(cat)} activeOpacity={0.7}>
              <Card style={styles.ligne}>
                <View style={styles.entete}>
                  <Text style={styles.nom}>{cat.emoji}  {cat.nom}</Text>
                  <Text style={styles.chiffres}>
                    {limite > 0
                      ? `${formatFCFA(depense)} / ${formatFCFA(limite)}`
                      : 'Définir un budget'}
                  </Text>
                </View>
                {limite > 0 && (
                  <>
                    <View style={styles.barreFond}>
                      <View
                        style={[
                          styles.barre,
                          {
                            width: `${ratio * 100}%`,
                            backgroundColor: depasse
                              ? colors.expense
                              : proche
                              ? colors.warning
                              : cat.couleur,
                          },
                        ]}
                      />
                    </View>
                    {depasse && (
                      <Text style={styles.alerte}>
                        ⚠️ Dépassé de {formatFCFA(depense - limite)}
                      </Text>
                    )}
                    {proche && (
                      <Text style={[styles.alerte, { color: colors.warning }]}>
                        Attention : plus de 80 % du budget utilisé
                      </Text>
                    )}
                  </>
                )}
              </Card>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal visible={!!modal} transparent animationType="fade" onRequestClose={() => setModal(null)}>
        <View style={styles.modalFond}>
          <View style={styles.modalCarte}>
            <Text style={styles.modalTitre}>
              {modal?.emoji} Budget « {modal?.nom} »
            </Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Montant mensuel en FCFA"
              placeholderTextColor={colors.textSecondary}
              value={saisie}
              onChangeText={(v) => setSaisie(v.replace(/[^0-9]/g, ''))}
              autoFocus
            />
            <DarkButton title="Enregistrer" onPress={enregistrer} />
            <TouchableOpacity onPress={() => setModal(null)} style={{ marginTop: 12 }}>
              <Text style={{ textAlign: 'center', color: colors.textSecondary, fontWeight: '600' }}>
                Annuler
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  sousTitre: { color: colors.textSecondary, marginTop: 4, marginBottom: 16, fontWeight: '600' },
  ligne: { marginBottom: 10 },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nom: { fontWeight: '700', color: colors.text, fontSize: 14 },
  chiffres: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  barreFond: {
    height: 8, backgroundColor: colors.cardSoft, borderRadius: 4,
    marginTop: 10, overflow: 'hidden',
  },
  barre: { height: 8, borderRadius: 4 },
  alerte: { color: colors.expense, fontSize: 12, fontWeight: '700', marginTop: 8 },
  modalFond: {
    flex: 1, backgroundColor: 'rgba(30,27,46,0.45)',
    justifyContent: 'center', padding: 24,
  },
  modalCarte: { backgroundColor: colors.card, borderRadius: 24, padding: 20, ...shadow },
  modalTitre: { fontWeight: '800', fontSize: 17, color: colors.text, marginBottom: 14 },
  input: {
    backgroundColor: colors.cardSoft, borderRadius: 14, paddingHorizontal: 16,
    paddingVertical: 12, fontSize: 16, color: colors.text, marginBottom: 14,
  },
});
