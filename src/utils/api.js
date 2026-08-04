import Constants from 'expo-constants';
import * as Network from 'expo-network';

const PORT_API = 3002;

/** URL du serveur en production. À renseigner avant publication. */
const URL_PRODUCTION = null;

/**
 * En développement, on déduit l'adresse du serveur de celle de Metro.
 *
 * Écrire une IP en dur est la première cause de « hors ligne » alors que tout
 * fonctionne : elle change avec le DHCP, et on choisit souvent par erreur une
 * interface virtuelle (VirtualBox, WSL, VPN) que le téléphone ne peut pas joindre.
 * Metro, lui, est forcément servi sur une adresse que le téléphone atteint —
 * puisque c'est par là qu'il a chargé l'app.
 */
function hoteDeDeveloppement() {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost ??
    Constants.manifest2?.extra?.expoGo?.debuggerHost ??
    null;

  const hote = hostUri?.split('://').pop()?.split('/')[0]?.split(':')[0];
  return hote ? `http://${hote}:${PORT_API}` : null;
}

export const API_URL = URL_PRODUCTION ?? hoteDeDeveloppement() ?? `http://localhost:${PORT_API}`;

const DELAI_MS = 15000; // au-delà, on considère le serveur injoignable

/**
 * Erreur d'API enrichie.
 *
 * `reseau: true`  → la requête n'a pas abouti. `horsLigne` précise pourquoi :
 *                   true  = l'appareil n'a pas de connexion (cas normal, silencieux) ;
 *                   false = l'appareil est connecté mais le serveur est injoignable
 *                           (mauvaise adresse, serveur éteint, pare-feu) — à signaler.
 * `reseau: false` → le serveur a répondu une erreur (401, 404, 500…).
 */
export class ErreurApi extends Error {
  constructor(message, { statut = null, reseau = false, horsLigne = false } = {}) {
    super(message);
    this.name = 'ErreurApi';
    this.statut = statut;
    this.reseau = reseau;
    this.horsLigne = horsLigne;
  }
}

/** Connectivité réelle de l'appareil. En cas de doute, on suppose connecté. */
export async function appareilConnecte() {
  try {
    const etat = await Network.getNetworkStateAsync();
    // isInternetReachable peut être indéterminé : seul un false explicite compte
    if (etat.isInternetReachable === false) return false;
    return etat.isConnected !== false;
  } catch {
    return true;
  }
}

async function requete(chemin, corps, token) {
  let res;
  try {
    const controleur = new AbortController();
    const minuteur = setTimeout(() => controleur.abort(), DELAI_MS);
    try {
      res = await fetch(`${API_URL}${chemin}`, {
        method: corps ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: corps ? JSON.stringify(corps) : undefined,
        signal: controleur.signal,
      });
    } finally {
      clearTimeout(minuteur);
    }
  } catch (e) {
    // fetch ne rejette que si la requête n'a pas abouti (DNS, socket, délai dépassé).
    // On demande alors à l'appareil s'il a du réseau : ça distingue « hors ligne »
    // d'un serveur qu'on n'arrive pas à joindre alors que la connexion est bonne.
    const horsLigne = !(await appareilConnecte());
    throw new ErreurApi(
      horsLigne
        ? 'Pas de connexion internet.'
        : `Serveur injoignable (${API_URL}). Vérifie qu'il tourne et que l'adresse est la bonne.`,
      { reseau: true, horsLigne },
    );
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = Array.isArray(data.message) ? data.message[0] : data.message;
    throw new ErreurApi(msg || `Erreur serveur (${res.status})`, { statut: res.status });
  }
  return data;
}

export const api = {
  register: (nomUtilisateur, telephone, motDePasse) =>
    requete('/auth/register', { nomUtilisateur, telephone, motDePasse }),
  login: (telephone, motDePasse) =>
    requete('/auth/login', { telephone, motDePasse }),
  verifierOtp: (telephone, code) =>
    requete('/auth/otp/verify', { telephone, code }),
  renvoyerOtp: (telephone) =>
    requete('/auth/otp/resend', { telephone }),
  // Synchronisation : pousse les données locales, reçoit l'état fusionné
  // du serveur ainsi qu'un jeton de licence rafraîchi
  sync: (transactions, budgets, token) =>
    requete('/sync', { transactions, budgets }, token),
  // Licence seule — au démarrage et au retour du réseau, sans pousser de données
  licence: (token) => requete('/licence', null, token),
};
