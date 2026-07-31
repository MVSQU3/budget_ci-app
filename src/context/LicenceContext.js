import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifierJeton, horlogeFiable, evaluerLicence } from '../utils/licence';
import { useAuth } from './AuthContext';

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
    const charge = verifierJeton(jetonBrut);
    const horloge = await horlogeFiable();
    setLicence(evaluerLicence(charge, horloge));
    return charge;
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
      const charge = verifierJeton(jetonBrut);
      if (!charge) {
        console.warn('[licence] jeton refusé : signature invalide');
        return;
      }
      // Un jeton émis pour un autre compte n'a rien à faire ici
      if (utilisateur?.id && charge.userId !== utilisateur.id) {
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
