// Client API vers le backend NestJS.
// ⚠️ Sur téléphone physique, remplace localhost par l'IP de ton PC (ex. http://192.168.1.10:3000)
export const API_URL = 'http://192.168.1.4:3000';

async function requete(chemin, corps, token) {
  const res = await fetch(`${API_URL}${chemin}`, {
    method: corps ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: corps ? JSON.stringify(corps) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = Array.isArray(data.message) ? data.message[0] : data.message;
    throw new Error(msg || 'Erreur réseau');
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
  // Synchronisation : pousse les données locales, reçoit l'état fusionné du serveur
  sync: (transactions, budgets, token) =>
    requete('/sync', { transactions, budgets }, token),
};
