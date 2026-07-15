import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/theme';
import { ScreenTitle, Card } from '../components/UI';
import { useBudget } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext';
import { notificationsIndisponibles } from '../utils/notifications';
import { formatFCFA } from '../utils/format';

export default function CompteScreen() {
  const { transactions, stats, synchroniser, syncEnCours, derniereSync, notifPrefs, definirNotifPref } = useBudget();
  const { utilisateur, deconnexion } = useAuth();

  const texteSync = syncEnCours
    ? 'Synchronisation en cours…'
    : derniereSync
    ? `Dernière sync : ${new Date(derniereSync).toLocaleString('fr-FR')}`
    : 'Jamais synchronisé';

  const effacerDonnees = () => {
    Alert.alert(
      'Tout effacer',
      'Supprimer toutes les transactions et budgets ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer', style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Fait', "Redémarre l'application pour repartir de zéro.");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenTitle>Compte</ScreenTitle>

        <Card style={styles.profil}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={26} color={colors.accent} />
          </View>
          <View>
            <Text style={styles.nom}>{utilisateur?.nomUtilisateur || 'Mon budget'}</Text>
            <Text style={styles.sous}>{utilisateur?.telephone || 'Devise : FCFA'}</Text>
          </View>
        </Card>

        <Card style={{ marginTop: 12 }}>
          <Ligne label="Transactions enregistrées" valeur={String(transactions.length)} />
          <Ligne label="Solde total" valeur={formatFCFA(stats.soldeTotal)} />
          <Ligne label="Dépenses ce mois" valeur={formatFCFA(stats.depenses)} />
        </Card>

        {/* Notifications */}
        <Card style={{ marginTop: 12 }}>
          <Text style={styles.sectionTitre}>Notifications</Text>
          {notificationsIndisponibles && (
            <Text style={styles.sous}>
              Indisponibles dans Expo Go (Android). Elles fonctionneront dans la version finale de l'app.
            </Text>
          )}
          <LigneNotif label="Budget dépassé" cle="depassement" prefs={notifPrefs} onChange={definirNotifPref} />
          <LigneNotif label="Seuil de 80 % atteint" cle="seuil" prefs={notifPrefs} onChange={definirNotifPref} />
          <LigneNotif label="Rappel de saisie (20h)" cle="quotidien" prefs={notifPrefs} onChange={definirNotifPref} />
          <LigneNotif label="Résumé hebdo (dim. 19h)" cle="hebdo" prefs={notifPrefs} onChange={definirNotifPref} />
          <LigneNotif label="Bilan mensuel (le 1er, 9h)" cle="mensuel" prefs={notifPrefs} onChange={definirNotifPref} />
          <LigneNotif label="Rappel tontine (sam. 9h)" cle="tontine" prefs={notifPrefs} onChange={definirNotifPref} />
          <LigneNotif label="Sync en retard (3 jours)" cle="sync" prefs={notifPrefs} onChange={definirNotifPref} />
        </Card>

        <Card style={{ marginTop: 12 }}>
          <TouchableOpacity onPress={synchroniser} disabled={syncEnCours} style={styles.ligneAction}>
            <Ionicons name="sync" size={18} color={colors.text} />
            <View>
              <Text style={styles.action}>Synchroniser maintenant</Text>
              <Text style={styles.sous}>{texteSync}</Text>
            </View>
          </TouchableOpacity>
        </Card>

        <Card style={{ marginTop: 12 }}>
          <TouchableOpacity onPress={deconnexion} style={styles.ligneAction}>
            <Ionicons name="log-out-outline" size={18} color={colors.text} />
            <Text style={styles.action}>Se déconnecter</Text>
          </TouchableOpacity>
        </Card>

        <Card style={{ marginTop: 12 }}>
          <TouchableOpacity onPress={effacerDonnees} style={styles.ligneAction}>
            <Ionicons name="trash-outline" size={18} color={colors.expense} />
            <Text style={styles.danger}>Effacer toutes les données</Text>
          </TouchableOpacity>
        </Card>

        <Text style={styles.version}>Budget FCFA · v1.0 · Données stockées sur l'appareil</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function LigneNotif({ label, cle, prefs, onChange }) {
  return (
    <View style={styles.ligne}>
      <Text style={styles.ligneLabel}>{label}</Text>
      <Switch
        value={!!prefs[cle]}
        onValueChange={(v) => onChange(cle, v)}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor="#fff"
      />
    </View>
  );
}

function Ligne({ label, valeur }) {
  return (
    <View style={styles.ligne}>
      <Text style={styles.ligneLabel}>{label}</Text>
      <Text style={styles.ligneValeur}>{valeur}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  profil: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.gradientTop,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  nom: { fontWeight: '800', fontSize: 16, color: colors.text },
  sous: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  ligneLabel: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  ligneValeur: { color: colors.text, fontWeight: '700', fontSize: 13 },
  sectionTitre: { fontWeight: '800', color: colors.text, fontSize: 14, marginBottom: 4 },
  ligneAction: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  action: { color: colors.text, fontWeight: '700' },
  danger: { color: colors.expense, fontWeight: '700' },
  version: { textAlign: 'center', color: colors.textSecondary, fontSize: 11, marginTop: 24 },
});
