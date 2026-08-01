import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifierJeton, horlogeFiable, evaluerLicence } from '../utils/licence';
import { useAuth } from './AuthContext';
import { api } from '../utils/api';

const LICENCE_KEY = '@budget_fcfa_licence';
const LicenceContext = createContext(null);

/** État tant qu'on n'a rien pu vérifier : on n'affirme rien. */
const ETAT_INITIAL = {
  valide: false,
  statut: 'inconnu',
  saisieAutorisee: true, // on ne bloque pas avant d'avoir vérifié
  enTolerance: false,
  joursRestants: 0,
  raison: 'chargement',
};

/**
 * Porte le jeton de licence et son évaluation.
 *
 * Le jeton est vérifié localement (Ed25519) : l'app sait si l'abonnement est
 * valable même sans réseau. Il se rafraîchit à chaque synchronisation réussie,
 * ce qui repousse d'autant la tolérance hors ligne.
 */
export function LicenceProvider({ children }) {
  const { token, utilisateur } = useAuth();
  const [jeton, setJeton] = useState(null);
  const [licence, setLicence] = useState(ETAT_INITIAL);
  const [charge, setCharge] = useState(false);

  /** Re-vérifie le jeton courant contre l'horloge. */
  const reevaluer = useCallback(async (jetonBrut) => {
    const contenu = verifierJeton(jetonBrut);
    const horloge = await horlogeFiable();
    setLicence(evaluerLicence(contenu, horloge));
    return contenu;
  }, []);

  // Chargement du jeton stocké
  useEffect(() => {
    (async () => {
      try {
        const stocke = await AsyncStorage.getItem(LICENCE_KEY);
        if (stocke) {
          setJeton(stocke);
          await reevaluer(stocke);
        } else {
          setLicence({ ...ETAT_INITIAL, raison: 'aucune-licence' });
        }
      } finally {
        setCharge(true);
      }
    })();
  }, [reevaluer]);

  /**
   * Enregistre un jeton fraîchement reçu du serveur.
   * Un jeton dont la signature est invalide est rejeté sans être stocké.
   */
  const enregistrerJeton = useCallback(
    async (jetonBrut) => {
      if (!jetonBrut) return;
      const contenu = verifierJeton(jetonBrut);
      if (!contenu) {
        console.warn(
          '[licence] jeton refusé : signature invalide. ' +
            'Cause la plus fréquente : CLE_PUBLIQUE_B64 (utils/licence.js) ne correspond ' +
            'pas à LICENCE_CLE_PRIVEE du serveur. La clé publique attendue est affichée ' +
            'dans les logs du serveur au démarrage.',
        );
        return;
      }
      // Un jeton émis pour un autre compte n'a rien à faire ici
      if (utilisateur?.id && contenu.userId !== utilisateur.id) {
        console.warn('[licence] jeton refusé : userId ne correspond pas');
        return;
      }
      setJeton(jetonBrut);
      await AsyncStorage.setItem(LICENCE_KEY, jetonBrut);
      await reevaluer(jetonBrut);
    },
    [reevaluer, utilisateur?.id],
  );

  /** À la déconnexion, la licence ne doit pas rester pour le compte suivant. */
  const oublierJeton = useCallback(async () => {
    setJeton(null);
    setLicence({ ...ETAT_INITIAL, raison: 'aucune-licence' });
    await AsyncStorage.removeItem(LICENCE_KEY);
  }, []);

  useEffect(() => {
    if (charge && !token) oublierJeton();
  }, [token, charge, oublierJeton]);

  /**
   * Récupère la licence après connexion, avant même la première synchronisation.
   * Sans ça, un compte tout juste connecté resterait sans jeton jusqu'à la
   * première sync — et donc dans l'état permissif par défaut.
   * Échec silencieux : hors ligne, la tolérance et le jeton stocké prennent le relais.
   */
  useEffect(() => {
    if (!charge || !token || jeton) return;
    let annule = false;
    (async () => {
      try {
        const res = await api.licence(token);
        if (!annule && res?.licence) await enregistrerJeton(res.licence);
      } catch {
        // hors ligne ou serveur indisponible : on réessaiera au prochain démarrage
      }
    })();
    return () => {
      annule = true;
    };
  }, [charge, token, jeton, enregistrerJeton]);

  // Le passage d'un jour à l'autre peut faire expirer la licence sans action
  // de l'utilisateur : on réévalue périodiquement plutôt qu'au seul démarrage.
  useEffect(() => {
    if (!jeton) return;
    const minuteur = setInterval(() => reevaluer(jeton), 60 * 1000);
    return () => clearInterval(minuteur);
  }, [jeton, reevaluer]);

  return (
    <LicenceContext.Provider
      value={{ licence, charge, enregistrerJeton, oublierJeton, reevaluer }}
    >
      {children}
    </LicenceContext.Provider>
  );
}

export const useLicence = () => useContext(LicenceContext);
