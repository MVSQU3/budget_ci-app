// Système « Organic » repris du design Budget FCFA :
// fond crème, terracotta, vert olive, cartes blanches très arrondies.
export const colors = {
  background: '#f5ead8', // crème de l'app
  card: '#FFFFFF',
  cardSoft: '#f9f4ed',
  text: '#201e1d',
  textSecondary: '#645c50',
  textMuted: '#82796a',
  textFaint: '#a19786',
  textGhost: '#c0b6a5',
  border: '#eee7db',
  borderFort: '#dcd3c4',

  // Terracotta — accent principal
  accent: '#c67139',
  accentFonce: '#b2622d',
  accentLien: '#8c491a',
  accentClair: '#f6a06b',
  surAccent: '#fff2eb',

  // Vert olive — revenus
  vert: '#56633f',
  vertClair: '#8fa073',
  vertMoyen: '#728157',
  surVert: '#f0fae1',
  vertBadge: '#e1eecc',

  // Carte pastel
  peche: '#ffe1d0',

  toast: '#2e2b25',
  surToast: '#f9f4ed',

  // Alias conservés pour le code existant
  income: '#56633f',
  expense: '#b2622d',
  warning: '#F6A94A',
  dark: '#c67139',
};

export const gradients = {
  // Bandeau de connexion (radial dans le design, approximé en diagonale)
  login: ['#f6a06b', '#c67139', '#8c491a'],
  // Carte de solde de l'accueil
  solde: ['#ffe1d0', '#f0fae1'],
};

export const radius = { card: 28, carte: 22, pilule: 999, chip: 999, button: 999 };

// Figtree (texte) + Caprasimo (titres display), chargées dans App.js
export const fonts = {
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semi: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
  extra: 'Figtree_800ExtraBold',
  display: 'Caprasimo_400Regular',
};

// Ombres du design : 0 1px 2px rgba(46,43,37,.12)
export const shadow = {
  shadowColor: '#2e2b25',
  shadowOpacity: 0.12,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 1 },
  elevation: 1,
};

// 0 3px 10px rgba(46,43,37,.14)
export const shadowMoyenne = {
  shadowColor: '#2e2b25',
  shadowOpacity: 0.14,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 4,
};

// 0 12px 32px rgba(46,43,37,.3)
export const shadowForte = {
  shadowColor: '#2e2b25',
  shadowOpacity: 0.3,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 12 },
  elevation: 12,
};
