import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadowMoyenne, fonts, gradients } from '../theme/theme';
import { Bouton } from '../components/UI';
import { useAuth } from '../context/AuthContext';

// Écran de connexion : bandeau terracotta à formes rondes, puis feuille crème
export default function ConnexionScreen({ navigation }) {
  const { login } = useAuth();
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [rester, setRester] = useState(true);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  const seConnecter = async () => {
    setErreur('');
    setChargement(true);
    try {
      const res = await login(telephone.trim(), motDePasse);
      if (res.verificationRequise) {
        navigation.navigate('Verification', { telephone: telephone.trim() });
      }
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  };

  return (
    <View style={styles.racine}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Bandeau haut */}
          <LinearGradient
            colors={gradients.login}
            start={{ x: 0.2, y: 0.1 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.blobClair} />
            <View style={styles.blobVert} />
            <View style={styles.heroTexte}>
              <Text style={styles.marque}>Budget{'\n'}FCFA</Text>
              <Text style={styles.accroche}>
                Suis tes dépenses, tiens tes budgets, garde ton mois en équilibre.
              </Text>
            </View>
          </LinearGradient>

          {/* Feuille de formulaire */}
          <View style={styles.feuille}>
            <Text style={styles.titre}>Connexion</Text>

            <View style={styles.champs}>
              <TextInput
                style={styles.input}
                placeholder="Téléphone (ex. +225 07 01 02 03 04)"
                placeholderTextColor={colors.textGhost}
                // keyboardType="phone-pad"
                autoCapitalize="none"
                value={telephone}
                onChangeText={setTelephone}
              />
              <View style={styles.sep} />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor={colors.textGhost}
                secureTextEntry
                value={motDePasse}
                onChangeText={setMotDePasse}
              />
            </View>

            <TouchableOpacity
              style={styles.ligneCoche}
              onPress={() => setRester((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={[styles.coche, !rester && styles.cocheVide]}>
                {rester && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              <Text style={styles.cocheLabel}>Rester connecté sur cet appareil</Text>
            </TouchableOpacity>

            {!!erreur && <Text style={styles.erreur}>{erreur}</Text>}

            <View style={styles.bas}>
              <Bouton
                title={
                  chargement
                    ? <ActivityIndicator color={colors.surAccent} />
                    : 'Se connecter'
                }
                onPress={seConnecter}
                disabled={chargement || !telephone || !motDePasse}
              />
              <View style={styles.ligneLien}>
                <Text style={styles.texteLien}>Pas encore de compte ?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Inscription')}>
                  <Text style={styles.lien}>Créer un compte</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  racine: { flex: 1, backgroundColor: colors.background },
  hero: { height: 300, overflow: 'hidden', justifyContent: 'flex-end' },
  blobClair: {
    position: 'absolute', width: 230, height: 230, borderRadius: 115,
    backgroundColor: 'rgba(255,242,235,0.16)', top: -60, right: -50,
  },
  blobVert: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(122,138,94,0.35)', bottom: 20, left: -30,
  },
  heroTexte: { paddingHorizontal: 28, paddingBottom: 44 },
  marque: { fontFamily: fonts.display, fontSize: 40, lineHeight: 44, color: colors.surAccent },
  accroche: {
    marginTop: 10, fontSize: 14, lineHeight: 19,
    color: 'rgba(255,242,235,0.85)', maxWidth: 230, fontFamily: fonts.regular,
  },
  feuille: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    marginTop: -30,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 24,
    gap: 18,
  },
  titre: { fontFamily: fonts.display, fontSize: 24, color: colors.text },
  champs: {
    backgroundColor: colors.card,
    borderRadius: 24,
    overflow: 'hidden',
    ...shadowMoyenne,
  },
  input: {
    paddingHorizontal: 20, paddingVertical: 17,
    fontSize: 14, color: colors.text, fontFamily: fonts.regular,
  },
  sep: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
  ligneCoche: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  coche: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  cocheVide: { backgroundColor: colors.borderFort },
  cocheLabel: { fontSize: 13, color: colors.textSecondary, fontFamily: fonts.regular },
  erreur: { color: colors.accentFonce, fontFamily: fonts.semi, textAlign: 'center' },
  bas: { marginTop: 'auto', gap: 14, paddingTop: 24 },
  ligneLien: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  texteLien: { fontSize: 13, color: colors.textSecondary, fontFamily: fonts.regular },
  lien: { fontSize: 13, color: colors.accentLien, fontFamily: fonts.bold },
});
