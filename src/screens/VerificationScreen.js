import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow, fonts } from '../theme/theme';
import Pave from '../components/Pave';
import { useAuth } from '../context/AuthContext';

// Écran "Enter verification code" des maquettes : 4 cases + pavé numérique
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
    if (k === '000') return;
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
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>

        <Image
          source={require('../../assets/mascotte/otp.png')}
          style={styles.mascotte}
          resizeMode="contain"
        />
        <Text style={styles.titre}>Code de{'\n'}vérification</Text>
        <Text style={styles.sous}>Un SMS avec le code a été envoyé au {telephone}</Text>

        <View style={styles.cases}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.case, code[i] && styles.caseRemplie]}>
              <Text style={styles.caseText}>{code[i] || ''}</Text>
            </View>
          ))}
        </View>

        {!!erreur && <Text style={styles.erreur}>{erreur}</Text>}
        {!!info && !erreur && <Text style={styles.info}>{info}</Text>}

        <Pave onKey={onKey} />

        <TouchableOpacity
          style={[styles.bouton, code.length < 4 && { opacity: 0.4 }]}
          onPress={valider}
          disabled={code.length < 4 || chargement}
          activeOpacity={0.8}
        >
          {chargement ? <ActivityIndicator color="#fff" /> : <Text style={styles.boutonText}>Continuer</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={renvoyer} style={{ marginTop: 14 }}>
          <Text style={styles.lien}>Renvoyer le code</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: 24 },
  back: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center', ...shadow,
  },
  mascotte: { width: 110, height: 110, alignSelf: 'center', marginTop: 4 },
  titre: { fontSize: 26, fontFamily: fonts.extra, color: colors.text, marginTop: 8 },
  sous: { color: colors.textSecondary, marginTop: 8, fontSize: 13, fontFamily: fonts.regular },
  cases: { flexDirection: 'row', gap: 12, marginTop: 28, marginBottom: 8, justifyContent: 'center' },
  case: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center', ...shadow,
  },
  caseRemplie: { backgroundColor: colors.gradientTop },
  caseText: { fontSize: 22, fontFamily: fonts.extra, color: colors.text },
  erreur: { color: colors.expense, fontFamily: fonts.semi, textAlign: 'center', marginTop: 8 },
  info: { color: colors.income, fontFamily: fonts.semi, textAlign: 'center', marginTop: 8 },
  bouton: {
    backgroundColor: colors.dark, borderRadius: 26,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  boutonText: { color: '#fff', fontFamily: fonts.bold, fontSize: 14 },
  lien: { color: colors.blue, fontFamily: fonts.bold, fontSize: 13, textAlign: 'center' },
});
