import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, shadow, fonts } from '../theme/theme';
import { ScreenTitle, TitreSection, Card } from '../components/UI';
import { useBudget, getCategorie } from '../context/BudgetContext';
import { formatFCFA, moisCourant, memeMois } from '../utils/format';

const MOIS_COURTS = ['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc'];

const memeMoisQue = (a, b) =>
  a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

// Statistiques : anneau de répartition (mois choisi) + barres des 6 derniers mois
export default function StatsScreen() {
  const { transactions } = useBudget();
  const [moisChoisi, setMoisChoisi] = useState(new Date());

  const changerMois = (delta) =>
    setMoisChoisi(new Date(moisChoisi.getFullYear(), moisChoisi.getMonth() + delta, 1));

  const { repartition, totalMois } = useMemo(() => {
    const parCategorie = {};
    transactions.forEach((t) => {
      if (t.type === 'depense' && memeMois(t.date, moisChoisi)) {
        parCategorie[t.categorieId] = (parCategorie[t.categorieId] || 0) + t.montant;
      }
    });
    const total = Object.values(parCategorie).reduce((s, v) => s + v, 0);
    const rep = Object.entries(parCategorie)
      .map(([id, montant]) => ({ cat: getCategorie(id), montant, part: total ? montant / total : 0 }))
      .sort((a, b) => b.montant - a.montant);
    return { repartition: rep, totalMois: total };
  }, [transactions, moisChoisi]);

  const sixMois = useMemo(() => {
    const res = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const dep = transactions
        .filter((t) => {
          const td = new Date(t.date);
          return t.type === 'depense'
            && td.getMonth() === d.getMonth()
            && td.getFullYear() === d.getFullYear();
        })
        .reduce((s, t) => s + t.montant, 0);
      res.push({ label: MOIS_COURTS[d.getMonth()], dep });
    }
    return res;
  }, [transactions]);

  const maxDep = Math.max(...sixMois.map((m) => m.dep), 1);
  const estMoisCourant = memeMoisQue(moisChoisi, new Date());

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenTitle>Statistiques</ScreenTitle>

        {/* Sélecteur de mois */}
        <View style={styles.selecteurMois}>
          <TouchableOpacity style={styles.fleche} onPress={() => changerMois(-1)} activeOpacity={0.7}>
            <Text style={styles.flecheText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.moisTexte}>{moisCourant(moisChoisi)}</Text>
          <TouchableOpacity
            style={[styles.fleche, estMoisCourant && { opacity: 0.3 }]}
            onPress={() => changerMois(1)}
            disabled={estMoisCourant}
            activeOpacity={0.7}
          >
            <Text style={styles.flecheText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Anneau de répartition */}
        <Card style={styles.carteAnneau}>
          <Anneau data={repartition} total={totalMois} />
          {repartition.length > 0 && (
            <View style={styles.legende}>
              {repartition.map(({ cat, montant, part }) => (
                <View key={cat.id} style={styles.legendeLigne}>
                  <View style={[styles.point, { backgroundColor: cat.couleur }]} />
                  <Text style={styles.legendeNom}>{cat.nom}</Text>
                  <Text style={styles.legendeMontant}>
                    {formatFCFA(montant)} · {Math.round(part * 100)} %
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Barres — 6 derniers mois */}
        <TitreSection style={{ marginTop: 24, marginBottom: 12 }}>6 derniers mois</TitreSection>
        <Card style={styles.carteBarres}>
          <View style={styles.barres}>
            {sixMois.map((m, i) => (
              <View key={i} style={styles.barreCol}>
                <Text style={styles.barreValeur}>
                  {m.dep ? `${Math.round(m.dep / 1000)}k` : ''}
                </Text>
                <View
                  style={[styles.barreDep, { height: Math.max((m.dep / maxDep) * 108, 4) }]}
                />
                <Text style={styles.barreLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Anneau plein (segments jointifs) de 186 px, trou blanc de 34 px d'épaisseur. */
function Anneau({ data, total }) {
  const taille = 186;
  const epaisseur = 34;
  const c = taille / 2;
  const r = c - epaisseur / 2;

  let angle = -90;
  const arcs = data.map(({ cat, part }) => {
    const balayage = part * 360;
    const a0 = (angle * Math.PI) / 180;
    const a1 = ((angle + balayage) * Math.PI) / 180;
    angle += balayage;
    // Un cercle complet ne peut pas être décrit par un seul arc SVG
    if (balayage >= 359.9) {
      return { cercle: true, color: cat.couleur, id: cat.id };
    }
    const grand = balayage > 180 ? 1 : 0;
    const d =
      `M ${c + r * Math.cos(a0)} ${c + r * Math.sin(a0)} ` +
      `A ${r} ${r} 0 ${grand} 1 ${c + r * Math.cos(a1)} ${c + r * Math.sin(a1)}`;
    return { d, color: cat.couleur, id: cat.id };
  });

  return (
    <View style={{ width: taille, height: taille }}>
      <Svg width={taille} height={taille}>
        <Circle cx={c} cy={c} r={r} stroke={colors.border} strokeWidth={epaisseur} fill="none" />
        {arcs.map((a) =>
          a.cercle ? (
            <Circle key={a.id} cx={c} cy={c} r={r} stroke={a.color} strokeWidth={epaisseur} fill="none" />
          ) : (
            <Path key={a.id} d={a.d} stroke={a.color} strokeWidth={epaisseur} fill="none" />
          )
        )}
      </Svg>
      <View style={styles.centreAnneau} pointerEvents="none">
        <Text style={styles.centreLabel}>Dépenses</Text>
        <Text style={styles.centreMontant}>{formatFCFA(total)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 130 },
  selecteurMois: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 16, marginTop: 16,
  },
  fleche: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center', ...shadow,
  },
  flecheText: { fontSize: 19, color: colors.text, marginTop: -3 },
  moisTexte: {
    fontFamily: fonts.extra, color: colors.text, fontSize: 15,
    minWidth: 150, textAlign: 'center',
  },
  carteAnneau: { borderRadius: 28, padding: 22, marginTop: 14, alignItems: 'center' },
  centreAnneau: {
    position: 'absolute', top: 34, left: 34, right: 34, bottom: 34,
    borderRadius: 999, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  centreLabel: { fontSize: 11.5, color: colors.textMuted, fontFamily: fonts.bold },
  centreMontant: { fontFamily: fonts.display, fontSize: 17, color: colors.text, marginTop: 2 },
  legende: { alignSelf: 'stretch', marginTop: 18 },
  legendeLigne: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  point: { width: 11, height: 11, borderRadius: 6 },
  legendeNom: { flex: 1, color: colors.text, fontFamily: fonts.semi, fontSize: 13 },
  legendeMontant: { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.bold },
  carteBarres: { borderRadius: 28, padding: 20 },
  barres: { flexDirection: 'row', alignItems: 'flex-end', height: 150, gap: 6 },
  barreCol: { flex: 1, alignItems: 'center', gap: 8 },
  barreValeur: { fontSize: 9.5, color: colors.textMuted, fontFamily: fonts.bold },
  barreDep: { width: 20, borderRadius: 999, backgroundColor: colors.accent },
  barreLabel: { fontSize: 11, color: colors.textSecondary, fontFamily: fonts.extra },
});
