import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadow } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

// Écran "Login" des maquettes : bandeau illustré, carte de formulaire, bouton sombre
export default function ConnexionScreen({ navigation }) {
  const { login } = useAuth();
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={{ fontSize: 56 }}>🤖</Text>
          </View>
          <View style={styles.carte}>
            <Text style={styles.titre}>Connexion</Text>

            <View style={styles.champs}>
              <TextInput
                style={styles.input}
                placeholder="Téléphone (ex. +2250701020304)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                autoCapitalize="none"
                value={telephone}
                onChangeText={setTelephone}
              />
              <View style={styles.sep} />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={motDePasse}
                onChangeText={setMotDePasse}
              />
            </View>

            {!!erreur && <Text style={styles.erreur}>{erreur}</Text>}

            <View style={styles.ligneBas}>
              <TouchableOpacity onPress={() => navigation.navigate('Inscription')}>
                <Text style={styles.lien}>Créer un compte</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bouton}
                onPress={seConnecter}
                disabled={chargement || !telephone || !motDePasse}
                activeOpacity={0.8}
              >
                {chargement
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.boutonText}>Connexion</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#A99BF0' },
  hero: { height: 220, alignItems: 'center', justifyContent: 'center' },
  carte: {
    flex: 1, backgroundColor: colors.background,
    borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24,
  },
  titre: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 24 },
  champs: { backgroundColor: colors.card, borderRadius: radius.card, ...shadow },
  input: { paddingHorizontal: 18, paddingVertical: 16, fontSize: 15, color: colors.text },
  sep: { height: 1, backgroundColor: colors.border, marginHorizontal: 14 },
  erreur: { color: colors.expense, marginTop: 12, fontWeight: '600', textAlign: 'center' },
  ligneBas: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 24,
  },
  lien: { color: colors.blue, fontWeight: '700', fontSize: 13 },
  bouton: {
    backgroundColor: colors.dark, borderRadius: radius.button,
    paddingVertical: 14, paddingHorizontal: 34, minWidth: 130, alignItems: 'center',
  },
  boutonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
