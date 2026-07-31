import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme/theme';
import { ScreenTitle, Card, Interrupteur } from '../components/UI';
import { useBudget } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext';
import { useLicence } from '../context/LicenceContext';
import { notificationsIndisponibles } from '../utils/notifications';
import { formatFCFA } from '../utils/format';

const NOTIFS = [
  { cle: 'depassement', label: 'Budget dépassé' },
  { cle: 'seuil', label: 'Seuil de 80 % atteint' },
  { cle: 'quotidien', label: 'Rappel de saisie (20h)' },
  { cle: 'hebdo', label: 'Résumé hebdo (dim. 19h)' },
  { cle: 'mensuel', label: 'Bilan mensuel (1er, 9h)' },
  { cle: 'tontine', label: 'Rappel tontine (sam. 9h)' },
  { cle: 'sync', label: 'Sync en retard (3 jours)' },
];

export default function CompteScreen() {
  const {
    transactions, stats, tontine, synchroniser, syncEnCours, derniereSync, syncErreur,
    notifPrefs, definirNotifPref,
  } = useBudget();
  const { utilisateur, deconnexion } = useAuth();
  const { licence } = useLicence();

  // Une panne de sauvegarde doit se voir : on distingue « hors ligne » d'une vraie erreur
  const enErreur = syncErreur && syncErreur.type !== 'reseau';
  const texteSync = syncEnCours
    ? 'Synchronisation en cours…'
    : enErreur
    ? syncErreur.type === 'auth'
      ? 'Session expirée — reconnecte-toi pour sauvegarder'
      : `Échec : ${syncErreur.message}`
    : syncErreur?.type === 'reseau'
    ? derniereSync
      ? `Hors ligne · dernière sauvegarde ${new Date(derniereSync).toLocaleString('fr-FR')}`
      : 'Hors ligne · aucune sauvegarde pour l’instant'
    : derniereSync
    ? `Dernière sync : ${new Date(derniereSync).toLocaleString('fr-FR')}`
    : 'Jamais synchronisé';

  // État d'abonnement, dérivé du jeton signé — lisible hors ligne
  const badgeAbo = {
    active: { texte: licence.statut === 'essai' ? 'Essai' : 'Actif', style: styles.badgeOk },
    tolerance: { texte: 'À renouveler', style: styles.badgeAlerte },
    expiree: { texte: 'Expiré', style: styles.badgeExpire },
    chargement: { texte: '…', style: styles.badgeNeutre },
    'aucune-licence': { texte: 'Non vérifié', style: styles.badgeNeutre },
  }[licence.raison] ?? { texte: '—', style: styles.badgeNeutre };

  const texteAbo = {
    active:
      licence.statut === 'essai'
        ? `Essai gratuit · ${licence.joursRestants} jour(s) restant(s)`
        : `Abonnement actif · ${licence.joursRestants} jour(s) restant(s)`,
    tolerance:
      'Période échue. Tu peux encore saisir quelques jours — connecte-toi pour renouveler.',
    expiree: 'Abonnement expiré — saisie bloquée. Renouvelle pour reprendre.',
    chargement: 'Vérification…',
    'aucune-licence': 'Connecte-toi pour vérifier ton abonnement.',
  }[licence.raison] ?? '—';

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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenTitle>Compte</ScreenTitle>

        {/* Profil */}
        <Card style={styles.profil}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={26} color={colors.accentFonce} />
          </View>
          <View>
            <Text style={styles.nom}>{utilisateur?.nomUtilisateur || 'Mon budget'}</Text>
            <Text style={styles.sous}>
              {utilisateur?.telephone ? `${utilisateur.telephone} · FCFA` : 'Devise : FCFA'}
            </Text>
          </View>
        </Card>

        {/* Abonnement */}
        <Card style={styles.bloc}>
          <View style={styles.ligneAbo}>
            <Text style={styles.sectionTitre}>Abonnement</Text>
            <Text style={[styles.badgeAbo, badgeAbo.style]}>{badgeAbo.texte}</Text>
          </View>
          <Text style={[styles.sous, licence.raison === 'expiree' && styles.sousErreur]}>
            {texteAbo}
          </Text>
        </Card>

        {/* Chiffres clés */}
        <Card style={styles.bloc}>
          <Ligne label="Transactions enregistrées" valeur={String(transactions.length)} />
          <Ligne label="Solde total" valeur={formatFCFA(stats.soldeTotal)} />
          <Ligne label="Dépenses ce mois" valeur={formatFCFA(stats.depenses)} />
          <Ligne label="Épargne tontine" valeur={formatFCFA(tontine.epargne)} />
        </Card>

        {/* Notifications */}
        <Card style={styles.bloc}>
          <Text style={styles.sectionTitre}>Notifications</Text>
          {notificationsIndisponibles && (
            <Text style={styles.avertissement}>
              Indisponibles dans Expo Go (Android). Elles fonctionneront dans la version finale.
            </Text>
          )}
          {NOTIFS.map((n) => (
            <View key={n.cle} style={styles.ligneNotif}>
              <Text style={styles.ligneLabel}>{n.label}</Text>
              <Interrupteur
                value={!!notifPrefs[n.cle]}
                onValueChange={(v) => definirNotifPref(n.cle, v)}
              />
            </View>
          ))}
        </Card>

        {/* Synchronisation */}
        <Card style={styles.bloc}>
          <TouchableOpacity
            onPress={() => synchroniser({ manuelle: true })}
            disabled={syncEnCours}
            style={styles.ligneAction}
            activeOpacity={0.7}
          >
            <Ionicons
              name={enErreur ? 'alert-circle' : 'sync'}
              size={18}
              color={enErreur ? colors.accentFonce : colors.text}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.action}>Synchroniser maintenant</Text>
              <Text style={[styles.sous, enErreur && styles.sousErreur]}>{texteSync}</Text>
            </View>
          </TouchableOpacity>
        </Card>

        <Card style={styles.bloc}>
          <TouchableOpacity onPress={deconnexion} style={styles.ligneAction} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={18} color={colors.text} />
            <Text style={styles.action}>Se déconnecter</Text>
          </TouchableOpacity>
        </Card>

        <Card style={styles.bloc}>
          <TouchableOpacity onPress={effacerDonnees} style={styles.ligneAction} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={18} color={colors.accentFonce} />
            <Text style={styles.danger}>Effacer toutes les données</Text>
          </TouchableOpacity>
        </Card>

        <Text style={styles.version}>Budget FCFA · v1.0 · Données stockées sur l'appareil</Text>
      </ScrollView>
    </SafeAreaView>
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
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 130 },
  profil: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 26, marginTop: 16 },
  avatar: {
    width: 58, height: 58, borderRadius: 29, backgroundColor: colors.peche,
    alignItems: 'center', justifyContent: 'center',
  },
  nom: { fontFamily: fonts.extra, fontSize: 16, color: colors.text },
  sous: { color: colors.textMuted, fontSize: 11.5, marginTop: 2, fontFamily: fonts.regular },
  sousErreur: { color: colors.accentFonce, fontFamily: fonts.semi },
  ligneAbo: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 6,
  },
  badgeAbo: {
    fontSize: 11, fontFamily: fonts.extra, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden',
  },
  badgeOk: { backgroundColor: colors.vertBadge, color: colors.vert },
  badgeAlerte: { backgroundColor: colors.peche, color: colors.accentFonce },
  badgeExpire: { backgroundColor: colors.accentFonce, color: colors.surAccent },
  badgeNeutre: { backgroundColor: colors.border, color: colors.textMuted },
  bloc: { borderRadius: 26, marginTop: 12 },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  ligneNotif: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 8,
  },
  ligneLabel: { color: colors.textSecondary, fontFamily: fonts.semi, fontSize: 13, flexShrink: 1 },
  ligneValeur: { color: colors.text, fontFamily: fonts.extra, fontSize: 13 },
  sectionTitre: { fontFamily: fonts.extra, color: colors.text, fontSize: 14, marginBottom: 6 },
  avertissement: { color: colors.textMuted, fontSize: 11.5, marginBottom: 6, fontFamily: fonts.regular },
  ligneAction: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  action: { color: colors.text, fontFamily: fonts.bold, fontSize: 13.5 },
  danger: { color: colors.accentFonce, fontFamily: fonts.bold, fontSize: 13.5 },
  version: { textAlign: 'center', color: colors.textMuted, fontSize: 11, marginTop: 22 },
});
