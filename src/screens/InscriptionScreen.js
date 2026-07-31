import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, shadowMoyenne, fonts } from "../theme/theme";
import { Bouton, BoutonRond } from "../components/UI";
import { useAuth } from "../context/AuthContext";

// Création de compte : bouton retour rond, titre display, carte de champs empilés
export default function InscriptionScreen({ navigation }) {
  const { register } = useAuth();
  const [nomUtilisateur, setNomUtilisateur] = useState("");
  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  const sInscrire = async () => {
    setErreur("");
    setChargement(true);
    try {
      console.log(
        "log de nomUtilisateur",
        nomUtilisateur.trim(),
        "log de telephone",
        telephone.trim(),
        "log de motDePasse",
        motDePasse,
      );
      await register(nomUtilisateur.trim(), telephone.trim(), motDePasse);
      navigation.navigate("Verification", { telephone: telephone.trim() });
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BoutonRond icone="arrow-back" onPress={() => navigation.goBack()} />

          <Text style={styles.titre}>Créer un compte</Text>
          <Text style={styles.sous}>
            On t'envoie un code par SMS pour vérifier ton numéro. Tes données
            restent sur ton téléphone.
          </Text>

          <View style={styles.champs}>
            <TextInput
              style={styles.input}
              placeholder="Nom d'utilisateur"
              placeholderTextColor={colors.textGhost}
              autoCapitalize="none"
              value={nomUtilisateur}
              onChangeText={setNomUtilisateur}
            />
            <View style={styles.sep} />
            <TextInput
              style={styles.input}
              placeholder="Téléphone"
              placeholderTextColor={colors.textGhost}
              keyboardType="phone-pad"
              value={telephone}
              onChangeText={setTelephone}
            />
            <View style={styles.sep} />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe (6 caractères min.)"
              placeholderTextColor={colors.textGhost}
              secureTextEntry
              value={motDePasse}
              onChangeText={setMotDePasse}
            />
          </View>

          {!!erreur && <Text style={styles.erreur}>{erreur}</Text>}

          <View style={styles.bas}>
            <Bouton
              title={
                chargement ? (
                  <ActivityIndicator color={colors.surAccent} />
                ) : (
                  "Recevoir le code SMS"
                )
              }
              onPress={sInscrire}
              disabled={
                chargement ||
                !nomUtilisateur ||
                !telephone ||
                motDePasse.length < 6
              }
            />
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.lien}>J'ai déjà un compte — Connexion</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 24,
    gap: 16,
  },
  titre: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
    color: colors.text,
    marginTop: 6,
  },
  sous: {
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  champs: {
    backgroundColor: colors.card,
    borderRadius: 24,
    overflow: "hidden",
    marginTop: 6,
    ...shadowMoyenne,
  },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 17,
    fontSize: 14,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  sep: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
  erreur: {
    color: colors.accentFonce,
    fontFamily: fonts.semi,
    textAlign: "center",
  },
  bas: { marginTop: "auto", gap: 14, paddingTop: 24 },
  lien: {
    fontSize: 13,
    color: colors.accentLien,
    fontFamily: fonts.bold,
    textAlign: "center",
  },
});
