import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, shadow, fonts } from '../theme/theme';
import { Bouton, BoutonRond } from '../components/UI';
import Pave from '../components/Pave';
import { useAuth } from '../context/AuthContext';

// Le pavé de l'OTP n'a pas de touche « 000 » : la case du milieu reste vide
const TOUCHES_OTP = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

// Vérification : 4 cases blanches, celle en cours cerclée de terracotta
export default function VerificationScreen({ route, navigation }) {
  const { telephone } = route.params;
  const { verifierOtp, renvoyerOtp } = useAuth();
  const [code, setCode] = useState('');
  const [erreur, setErreur] = useState('');
  const [info, setInfo] = useState('');
  const [chargement, setChargement] = useState(false);

  const onKey = (k) => {
    setErreur('');
    if (k === '⌫') return setCode((c) => c.slice(0, -1));
    setCode((c) => (c.length < 4 ? c + k : c));
  };

  const valider = async () => {
    setChargement(true);
    setErreur('');
    try {
      await verifierOtp(telephone, code);
      // Une fois connecté, App.js bascule automatiquement vers les onglets
    } catch (e) {
      setErreur(e.message);
      setCode('');
    } finally {
      setChargement(false);
    }
  };

  const renvoyer = async () => {
    setErreur('');
    try {
      await renvoyerOtp(telephone);
      setInfo('Nouveau code envoyé.');
    } catch (e) {
      setErreur(e.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <BoutonRond icone="arrow-back" onPress={() => navigation.goBack()} />

        <Text style={styles.titre}>Vérification</Text>
        <Text style={styles.sous}>
          Code envoyé au <Text style={styles.numero}>{telephone}</Text>
        </Text>

        <View style={styles.cases}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.case, code.length === i && styles.caseActive]}>
              <Text style={styles.caseText}>{code[i] || ''}</Text>
            </View>
          ))}
        </View>

        {!!erreur && <Text style={styles.erreur}>{erreur}</Text>}
        {!!info && !erreur && <Text style={styles.info}>{info}</Text>}

        <View style={styles.bas}>
          <Pave onKey={onKey} touches={TOUCHES_OTP} hauteur={58} taille={25} />

          <Bouton
            title={chargement ? <ActivityIndicator color={colors.surAccent} /> : 'Vérifier'}
            onPress={valider}
            disabled={code.length < 4 || chargement}
          />

          <TouchableOpacity onPress={renvoyer}>
            <Text style={styles.lien}>Renvoyer le code</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 22, paddingBottom: 24, gap: 16 },
  titre: { fontFamily: fonts.display, fontSize: 28, color: colors.text, marginTop: 6 },
  sous: { fontSize: 13.5, color: colors.textSecondary, fontFamily: fonts.regular },
  numero: { fontFamily: fonts.extra, color: colors.text },
  cases: { flexDirection: 'row', gap: 10, marginTop: 10 },
  case: {
    flex: 1, height: 62, borderRadius: 20, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center', ...shadow,
  },
  caseActive: { borderWidth: 2, borderColor: colors.accent },
  caseText: { fontSize: 26, fontFamily: fonts.bold, color: colors.text },
  erreur: { color: colors.accentFonce, fontFamily: fonts.semi, textAlign: 'center' },
  info: { color: colors.vert, fontFamily: fonts.semi, textAlign: 'center' },
  bas: { marginTop: 'auto', gap: 12 },
  lien: { fontSize: 13, color: colors.accentLien, fontFamily: fonts.bold, textAlign: 'center' },
});
