import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { colors } from '../theme/theme';
import { ScreenTitle, Card } from '../components/UI';
import { useBudget, getCategorie } from '../context/BudgetContext';
import { formatFCFA, moisCourant } from '../utils/format';

// Statistiques du mois : anneau de répartition + barres 6 derniers mois
export default function StatsScreen() {
  const { stats, transactions } = useBudget();

  const repartition = useMemo(() => {
    const total = Object.values(stats.parCategorie).reduce((s, v) => s + v, 0);
    return Object.entries(stats.parCategorie)
      .map(([id, montant]) => ({ cat: getCategorie(id), montant, part: total ? montant / total : 0 }))
      .sort((a, b) => b.montant - a.montant);
  }, [stats]);

  const sixMois = useMemo(() => {
    const res = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const dep = transactions
        .filter((t) => {
          const td = new Date(t.date);
          return t.type === 'depense' && td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
        })
        .reduce((s, t) => s + t.montant, 0);
      res.push({ label: ['J','F','M','A','M','J','J','A','S','O','N','D'][d.getMonth()], dep });
    }
    return res;
  }, [transactions]);

  const maxDep = Math.max(...sixMois.map((m) => m.dep), 1);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenTitle>Statistiques</ScreenTitle>
        <Text style={styles.sousTitre}>{moisCourant()}</Text>

        {/* Anneau de répartition des dépenses */}
        <Card style={{ alignItems: 'center' }}>
          {repartition.length === 0 ? (
            <Text style={styles.vide}>Ajoute des dépenses pour voir la répartition.</Text>
          ) : (
            <>
              <Anneau data={repartition} total={stats.depenses} />
              <View style={styles.legende}>
                {repartition.map(({ cat, montant, part }) => (
                  <View key={cat.id} style={styles.legendeLigne}>
                    <View style={[styles.point, { backgroundColor: cat.couleur }]} />
                    <Text style={styles.legendeNom}>{cat.emoji} {cat.nom}</Text>
                    <Text style={styles.legendeMontant}>
                      {formatFCFA(montant)} · {Math.round(part * 100)} %
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </Card>

        {/* Barres — 6 derniers mois */}
        <Text style={styles.section}>Dépenses — 6 derniers mois</Text>
        <Card>
          <View style={styles.barres}>
            {sixMois.map((m, i) => (
              <View key={i} style={styles.barreCol}>
                <View style={styles.barreZone}>
                  <View
                    style={[
                      styles.barreDep,
                      { height: `${Math.max((m.dep / maxDep) * 100, m.dep > 0 ? 6 : 2)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.barreLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Anneau({ data, total }) {
  const size = 180;
  const r = 70;
  const cx = size / 2;
  const cy = size / 2;
  let angle = -90;

  const arcs = data.map(({ cat, part }) => {
    const sweep = Math.max(part * 360 - 2, 1);
    const a0 = (angle * Math.PI) / 180;
    const a1 = ((angle + sweep) * Math.PI) / 180;
    angle += part * 360;
    const large = sweep > 180 ? 1 : 0;
    const d = `M ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}`;
    return { d, color: cat.couleur, id: cat.id };
  });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} stroke={colors.cardSoft} strokeWidth={18} fill="none" />
        <G>
          {arcs.map((a) => (
            <Path key={a.id} d={a.d} stroke={a.color} strokeWidth={18} fill="none" strokeLinecap="round" />
          ))}
        </G>
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>Dépenses</Text>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{formatFCFA(total)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  sousTitre: { color: colors.textSecondary, marginTop: 4, marginBottom: 16, fontWeight: '600' },
  vide: { color: colors.textSecondary, paddingVertical: 20, textAlign: 'center' },
  legende: { alignSelf: 'stretch', marginTop: 16 },
  legendeLigne: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  point: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  legendeNom: { flex: 1, color: colors.text, fontWeight: '600', fontSize: 13 },
  legendeMontant: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  section: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 24, marginBottom: 12 },
  barres: { flexDirection: 'row', height: 140, alignItems: 'flex-end' },
  barreCol: { flex: 1, alignItems: 'center' },
  barreZone: { height: 110, width: 18, justifyContent: 'flex-end' },
  barreDep: { width: 18, borderRadius: 9, backgroundColor: colors.accent },
  barreLabel: { marginTop: 6, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
});
