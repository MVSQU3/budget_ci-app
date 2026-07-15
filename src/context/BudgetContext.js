import React, { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { memeMois, formatFCFA } from '../utils/format';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';
import { initNotifications, notifier, replanifierRecurrentes } from '../utils/notifications';

const STORAGE_KEY = '@budget_fcfa_v2';
const NOTIF_KEY = '@budget_fcfa_notifs';

// Préférences de notifications (toutes activées par défaut)
export const NOTIF_DEFAUT = {
  depassement: true, // budget dépassé (immédiat)
  seuil: true,       // 80 % du budget atteint (immédiat)
  quotidien: true,   // rappel de saisie à 20h
  hebdo: true,       // résumé le dimanche à 19h
  mensuel: true,     // bilan le 1er du mois à 9h
  tontine: true,     // rappel épargne le samedi à 9h
  sync: true,        // données non synchronisées depuis 3 jours
};

// `icone` = nom d'icône Ionicons (https://icons.expo.fyi)
export const CATEGORIES = [
  { id: 'alimentation', nom: 'Alimentation', icone: 'restaurant', couleur: '#F6A94A' },
  { id: 'transport', nom: 'Transport', icone: 'bus', couleur: '#5B8DEF' },
  { id: 'logement', nom: 'Logement', icone: 'home', couleur: '#8B7CF6' },
  { id: 'sante', nom: 'Santé', icone: 'medkit', couleur: '#34C77B' },
  { id: 'education', nom: 'Éducation', icone: 'book', couleur: '#F65E7A' },
  { id: 'communication', nom: 'Crédit / Internet', icone: 'phone-portrait', couleur: '#2BB8C4' },
  { id: 'famille', nom: 'Famille & soutien', icone: 'people', couleur: '#B58AE6' },
  { id: 'tontine', nom: 'Tontine / Épargne', icone: 'wallet', couleur: '#E0B33C' },
  { id: 'loisirs', nom: 'Loisirs', icone: 'game-controller', couleur: '#FF8A65' },
  { id: 'autre', nom: 'Autre', icone: 'cube', couleur: '#9A96A8' },
];

export const SOURCES_REVENU = [
  { id: 'salaire', nom: 'Salaire', icone: 'briefcase', couleur: '#34C77B' },
  { id: 'commerce', nom: 'Commerce', icone: 'storefront', couleur: '#5B8DEF' },
  { id: 'transfert', nom: 'Transfert reçu', icone: 'swap-horizontal', couleur: '#8B7CF6' },
  { id: 'autre_revenu', nom: 'Autre', icone: 'add-circle', couleur: '#9A96A8' },
];

const BudgetContext = createContext(null);

/**
 * Offline-first : les données vivent en local (AsyncStorage) et l'app marche sans réseau.
 * Chaque élément porte un timestamp `majLe` ; les suppressions sont des tombstones
 * (supprime: true) pour se propager aux autres appareils. La sync est best-effort :
 * au démarrage, à la connexion, et après chaque modification.
 */
export function BudgetProvider({ children }) {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState([]); // inclut les tombstones
  const [budgets, setBudgets] = useState({}); // { categorieId: { montant, majLe } }
  const [charge, setCharge] = useState(false);
  const [syncEnCours, setSyncEnCours] = useState(false);
  const [derniereSync, setDerniereSync] = useState(null);
  const [notifPrefs, setNotifPrefs] = useState(NOTIF_DEFAUT);
  const syncTimer = useRef(null);
  const syncNotifie = useRef(false); // pour ne notifier la sync en retard qu'une fois

  // Chargement local
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          setTransactions(data.transactions || []);
          setBudgets(data.budgets || {});
          setDerniereSync(data.derniereSync || null);
        }
        const rawNotifs = await AsyncStorage.getItem(NOTIF_KEY);
        if (rawNotifs) setNotifPrefs({ ...NOTIF_DEFAUT, ...JSON.parse(rawNotifs) });
        await initNotifications(); // demande la permission
      } catch (e) {
        console.warn('Erreur de chargement', e);
      } finally {
        setCharge(true);
      }
    })();
  }, []);

  // Sauvegarde locale
  useEffect(() => {
    if (!charge) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ transactions, budgets, derniereSync }),
    ).catch(() => {});
  }, [transactions, budgets, derniereSync, charge]);

  // (Re)planification des notifications récurrentes quand les préférences changent
  useEffect(() => {
    if (!charge) return;
    AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(notifPrefs)).catch(() => {});
    replanifierRecurrentes(notifPrefs);
  }, [notifPrefs, charge]);

  const definirNotifPref = (cle, valeur) =>
    setNotifPrefs((prev) => ({ ...prev, [cle]: valeur }));

  // Synchronisation avec le serveur (best-effort, silencieuse si hors ligne)
  const synchroniser = useCallback(async () => {
    if (!token) return;
    setSyncEnCours(true);
    try {
      const budgetsListe = Object.entries(budgets).map(([categorieId, b]) => ({
        categorieId,
        montant: b.montant,
        majLe: b.majLe,
      }));
      const res = await api.sync(transactions, budgetsListe, token);

      // L'état serveur est l'état fusionné : on l'adopte tel quel
      setTransactions(res.transactions);
      const nouveauxBudgets = {};
      res.budgets.forEach((b) => {
        nouveauxBudgets[b.categorieId] = { montant: b.montant, majLe: b.majLe };
      });
      setBudgets(nouveauxBudgets);
      setDerniereSync(res.syncLe);
    } catch (e) {
      // Hors ligne ou serveur indisponible : on réessaiera plus tard, les données restent locales
      const TROIS_JOURS = 3 * 24 * 60 * 60 * 1000;
      if (
        notifPrefs.sync &&
        !syncNotifie.current &&
        derniereSync &&
        Date.now() - derniereSync > TROIS_JOURS
      ) {
        syncNotifie.current = true;
        notifier(
          'Synchronisation en attente',
          "Tes données n'ont pas été synchronisées depuis plus de 3 jours. Vérifie ta connexion.",
        );
      }
    } finally {
      setSyncEnCours(false);
    }
  }, [token, transactions, budgets]);

  // Sync au démarrage / à la connexion
  useEffect(() => {
    if (charge && token) synchroniser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charge, token]);

  // Sync différée après chaque modification (regroupe les changements rapprochés)
  const planifierSync = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => synchroniser(), 2000);
  }, [synchroniser]);

  const ajouterTransaction = ({ type, montant, categorieId, note }) => {
    const tx = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      type,
      montant: Math.abs(Number(montant)),
      categorieId,
      note: note || '',
      date: new Date().toISOString(),
      supprime: false,
      majLe: Date.now(),
    };
    setTransactions((prev) => [tx, ...prev]);
    planifierSync();

    // Alertes de budget (immédiates) : seuil de 80 % et dépassement
    if (type === 'depense') {
      const limite = budgets[categorieId]?.montant || 0;
      if (limite > 0) {
        const avant = transactions
          .filter((t) => !t.supprime && t.type === 'depense' && t.categorieId === categorieId && memeMois(t.date))
          .reduce((s, t) => s + t.montant, 0);
        const apres = avant + tx.montant;
        const cat = getCategorie(categorieId);
        if (notifPrefs.depassement && avant <= limite && apres > limite) {
          notifier(
            `Budget « ${cat.nom} » dépassé`,
            `Tu as dépensé ${formatFCFA(apres)} sur un budget de ${formatFCFA(limite)}.`,
          );
        } else if (notifPrefs.seuil && avant < limite * 0.8 && apres >= limite * 0.8 && apres <= limite) {
          notifier(
            `Budget « ${cat.nom} » : 80 % atteint`,
            `${formatFCFA(apres)} dépensés sur ${formatFCFA(limite)}. Reste ${formatFCFA(limite - apres)}.`,
          );
        }
      }
    }
  };

  const supprimerTransaction = (id) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, supprime: true, majLe: Date.now() } : t)),
    );
    planifierSync();
  };

  const definirBudget = (categorieId, montant) => {
    setBudgets((prev) => ({
      ...prev,
      [categorieId]: { montant: Math.abs(Number(montant)) || 0, majLe: Date.now() },
    }));
    planifierSync();
  };

  // Transactions visibles (sans les tombstones)
  const visibles = useMemo(
    () => transactions.filter((t) => !t.supprime),
    [transactions],
  );

  // Budgets sous forme simple { categorieId: montant } pour les écrans
  const budgetsSimples = useMemo(() => {
    const out = {};
    Object.entries(budgets).forEach(([id, b]) => {
      if (b.montant > 0) out[id] = b.montant;
    });
    return out;
  }, [budgets]);

  const stats = useMemo(() => {
    const duMois = visibles.filter((t) => memeMois(t.date));
    const revenus = duMois.filter((t) => t.type === 'revenu').reduce((s, t) => s + t.montant, 0);
    const depenses = duMois.filter((t) => t.type === 'depense').reduce((s, t) => s + t.montant, 0);
    const parCategorie = {};
    duMois.forEach((t) => {
      if (t.type === 'depense') {
        parCategorie[t.categorieId] = (parCategorie[t.categorieId] || 0) + t.montant;
      }
    });
    const soldeTotal = visibles.reduce(
      (s, t) => s + (t.type === 'revenu' ? t.montant : -t.montant), 0,
    );
    return { revenus, depenses, solde: revenus - depenses, soldeTotal, parCategorie };
  }, [visibles]);

  return (
    <BudgetContext.Provider
      value={{
        transactions: visibles,
        budgets: budgetsSimples,
        stats,
        charge,
        syncEnCours,
        derniereSync,
        synchroniser,
        ajouterTransaction,
        supprimerTransaction,
        definirBudget,
        notifPrefs,
        definirNotifPref,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

export const useBudget = () => useContext(BudgetContext);

export const getCategorie = (id) =>
  CATEGORIES.find((c) => c.id === id) ||
  SOURCES_REVENU.find((c) => c.id === id) ||
  CATEGORIES[CATEGORIES.length - 1];
