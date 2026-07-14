# Budget FCFA

Application mobile de suivi de budget en français, devise FCFA. Style visuel inspiré de tes maquettes (thème clair, cartes arrondies, pavé numérique).

## Fonctionnalités

- Saisie de dépenses et revenus avec pavé numérique (style écran « Amount » des maquettes), catégories adaptées au contexte ouest-africain (alimentation, transport, crédit/internet, famille & soutien, tontine/épargne…)
- Budgets mensuels par catégorie avec barres de progression et alertes de dépassement (avertissement à 80 %, alerte au-delà)
- Statistiques : anneau de répartition des dépenses du mois et barres des 6 derniers mois
- Historique groupé par jour (appui long pour supprimer)
- Sauvegarde locale automatique (AsyncStorage) — fonctionne hors ligne
- Connexion / Inscription avec vérification SMS (OTP) via le backend NestJS (dossier `../budget-backend`)
- Synchronisation serveur offline-first : sync automatique au démarrage et après chaque modification, bouton « Synchroniser maintenant » dans Compte ; l'app reste utilisable hors ligne

## Lancer l'app

1. Installe Node.js puis, dans ce dossier :
   ```
   npm install
   npx expo start
   ```
2. Installe **Expo Go** sur ton téléphone (Play Store / App Store)
3. Scanne le QR code affiché dans le terminal

## Structure

```
App.js                    Navigation (onglets + écran de saisie modal)
src/theme/theme.js        Couleurs et styles (maquettes, thème clair)
src/utils/format.js       Formatage FCFA et dates en français
src/context/BudgetContext.js  Données, catégories, calculs, persistance
src/components/           Carte, boutons, chips, pavé numérique
src/screens/              Accueil, Saisie, Transactions, Budgets, Stats, Compte
```

## Backend

L'authentification nécessite le backend NestJS (`../budget-backend`, voir son README). Avant de tester sur téléphone, mets l'IP de ton PC dans `src/utils/api.js` (variable `API_URL`).

## Prochaines étapes possibles

- Thème sombre (2e jeu de maquettes)
- Multi-comptes, synchronisation Mobile Money
