// Client API vers le backend NestJS.
// ⚠️ Sur téléphone physique, remplace localhost par l'IP de ton PC (ex. http://192.168.1.10:3000)
export const API_URL = 'http://192.168.56.1:3002';

const DELAI_MS = 15000; // au-delà, on considère le serveur injoignable

/**
 * Erreur d'API enrichie.
 * `reseau: true`  → serveur injoignable (vraiment hors ligne) : normal, silencieux.
 * `reseau: false` → le serveur a répondu une erreur (401, 404, 500…) : anormal, à montrer.
 */
export class ErreurApi extends Error {
  constructor(message, { statut = null, reseau = false } = {}) {
    super(message);
    this.name = 'ErreurApi';
    this.statut = statut;
    this.reseau = reseau;
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
    // fetch ne rejette que si la requête n'a pas abouti (DNS, socket, délai dépassé)
    throw new ErreurApi('Serveur injoignable. Vérifie ta connexion.', { reseau: true });
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
