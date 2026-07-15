// Thème clair inspiré des maquettes (fonds pastels, cartes blanches arrondies, accent sombre)
export const colors = {
  background: '#F4F3F8',
  gradientTop: '#EDE9FB', // lavande pâle des headers
  card: '#FFFFFF',
  cardSoft: '#F7F6FA',
  text: '#1E1B2E',
  textSecondary: '#9A96A8',
  dark: '#221F35', // boutons principaux sombres
  accent: '#8B7CF6', // violet
  income: '#34C77B', // vert
  expense: '#F65E7A', // rose/rouge
  warning: '#F6A94A', // orange
  blue: '#5B8DEF',
  border: '#EEECF3',
};

// Dégradés pastel des maquettes (haut → bas ou diagonale)
export const gradients = {
  header: ['#EDE9FB', '#FBEDF2'],       // lavande → rose pâle (headers d'écrans)
  solde: ['#E9E3FB', '#FBE9EE'],        // carte de solde (Accueil)
  login: ['#A99BF0', '#8B7CF6'],        // bandeau violet (Connexion)
  register: ['#F2A9C4', '#F65E7A'],     // bandeau rose (Inscription)
  otp: ['#F6C6A0', '#F2A9C4'],          // pêche → rose (Vérification)
};

export const radius = { card: 20, button: 26, chip: 14 };

// Police Poppins (chargée dans App.js via expo-font)
export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semi: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extra: 'Poppins_800ExtraBold',
};

export const shadow = {
  shadowColor: '#1E1B2E',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};
