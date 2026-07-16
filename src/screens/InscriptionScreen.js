import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Image,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow, fonts, gradients } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

// Écran "Register" des maquettes
export default function InscriptionScreen({ navigation }) {
  const { register } = useAuth();
  const [nomUtilisateur, setNomUtilisateur] = useState('');
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  const sInscrire = async () => {
    setErreur('');
    setChargement(true);
    try {
      await register(nomUtilisateur.trim(), telephone.trim(), motDePasse);
      navigation.navigate('Verification', { telephone: telephone.trim() });
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={gradients.register} style={styles.hero}>
            <Image
              source={require('../../assets/mascotte/inscription.png')}
              style={styles.mascotte}
              resizeMode="contain"
            />
          </LinearGradient>
          <View style={styles.carte}>
            <Text style={styles.titre}>Inscription</Text>

            <View style={styles.champs}>
              <TextInput
                style={styles.input}
                placeholder="Nom d'utilisateur"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                value={nomUtilisateur}
                onChangeText={setNomUtilisateur}
              />
              <View style={styles.sep} />
              <TextInput
                style={styles.input}
                placeholder="Téléphone (ex. +2250701020304)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                value={telephone}
                onChangeText={setTelephone}
              />
              <View style={styles.sep} />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe (6 caractères min.)"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={motDePasse}
                onChangeText={setMotDePasse}
              />
            </View>

            {!!erreur && <Text style={styles.erreur}>{erreur}</Text>}

            <TouchableOpacity
              style={styles.bouton}
              onPress={sInscrire}
              disabled={chargement || !nomUtilisateur || !telephone || motDePasse.length < 6}
              activeOpacity={0.8}
            >
              {chargement
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.boutonText}>S'inscrire</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
              <Text style={styles.lien}>J'ai déjà un compte — Connexion</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2A9C4' },
  hero: { height: 200, alignItems: 'center', justifyContent: 'center' },
  mascotte: { width: 150, height: 150 },
  carte: {
    flex: 1, backgroundColor: colors.background,
    borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24,
  },
  titre: { fontSize: 24, fontFamily: fonts.extra, color: colors.text, textAlign: 'center', marginBottom: 24 },
  champs: { backgroundColor: colors.card, borderRadius: radius.card, ...shadow },
  input: { paddingHorizontal: 18, paddingVertical: 16, fontSize: 14, color: colors.text, fontFamily: fonts.regular },
  sep: { height: 1, backgroundColor: colors.border, marginHorizontal: 14 },
  erreur: { color: colors.expense, marginTop: 12, fontFamily: fonts.semi, textAlign: 'center' },
  bouton: {
    backgroundColor: colors.dark, borderRadius: radius.button,
    paddingVertical: 16, alignItems: 'center', marginTop: 24,
  },
  boutonText: { color: '#fff', fontFamily: fonts.bold, fontSize: 14 },
  lien: { color: colors.blue, fontFamily: fonts.bold, fontSize: 13, textAlign: 'center' },
});
