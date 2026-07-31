// Formatage FCFA (XOF/XAF) — pas de décimales, séparateur de milliers avec espace
export function formatFCFA(amount) {
  const n = Math.round(Number(amount) || 0);
  const s = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${n < 0 ? '-' : ''}${s} FCFA`;
}

export function formatSigned(amount, type) {
  const prefix = type === 'revenu' ? '+ ' : '− '; // signe moins typographique, comme le design
  return prefix + formatFCFA(Math.abs(amount));
}

const MOIS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

export function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatHeure(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const JOURS = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];

/** En-tête de groupe de l'historique : « Aujourd'hui » ou « vendredi 12 septembre ». */
export function formatJour(iso) {
  const d = new Date(iso);
  if (d.toDateString() === new Date().toDateString()) return "Aujourd'hui";
  return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`;
}

export function moisCourant(date = new Date()) {
  return `${MOIS[date.getMonth()]} ${date.getFullYear()}`;
}

export function memeMois(iso, ref = new Date()) {
  const d = new Date(iso);
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
}
