import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Dans Expo Go (Android, SDK 53+), le simple import d'expo-notifications fait
 * planter l'app car le module enregistre un listener push interdit dans Expo Go.
 * On ne charge donc le module que hors Expo Go (development build / production).
 * Dans Expo Go, toutes les fonctions deviennent des no-op silencieux.
 */
const estExpoGo = Constants.appOwnership === 'expo';
const desactive = estExpoGo && Platform.OS === 'android';

let Notifications = null;
if (!desactive) {
  try {
    // eslint-disable-next-line global-require
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    Notifications = null;
  }
}

/** Demande la permission (à appeler au démarrage). Retourne true si accordée. */
export async function initNotifications() {
  if (!Notifications) return false;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (e) {
    return false;
  }
}

/** Notification immédiate (alertes de budget, sync...). */
export function notifier(titre, corps) {
  if (!Notifications) return Promise.resolve();
  return Notifications.scheduleNotificationAsync({
    content: { title: titre, body: corps },
    trigger: null,
  }).catch(() => {});
}

/**
 * (Re)planifie les notifications récurrentes selon les préférences.
 * On annule tout puis on replanifie : simple et sans doublons.
 */
export async function replanifierRecurrentes(prefs) {
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (prefs.quotidien) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Budget FCFA',
          body: "As-tu noté tes dépenses d'aujourd'hui ?",
        },
        trigger: { type: 'daily', hour: 20, minute: 0 },
      });
    }

    if (prefs.hebdo) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Résumé de la semaine',
          body: 'Ouvre les statistiques pour voir tes dépenses de la semaine.',
        },
        trigger: { type: 'weekly', weekday: 1, hour: 19, minute: 0 }, // dimanche 19h
      });
    }

    if (prefs.mensuel) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Bilan du mois',
          body: 'Ton bilan mensuel est prêt : dépenses, revenus et budgets.',
        },
        trigger: { type: 'monthly', day: 1, hour: 9, minute: 0 }, // le 1er à 9h
      });
    }

    if (prefs.tontine) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Tontine / Épargne',
          body: "C'est le jour de ton versement d'épargne 💰",
        },
        trigger: { type: 'weekly', weekday: 7, hour: 9, minute: 0 }, // samedi 9h
      });
    }
  } catch (e) {
    // Permissions refusées ou indisponible : on ignore silencieusement
  }
}

/** true si les notifications sont indisponibles (Expo Go Android). */
export const notificationsIndisponibles = desactive;
