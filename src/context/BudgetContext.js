import React, { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { memeMois } from '../utils/format';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

const STORAGE_KEY = '@budget_fcfa_v2';

export const CATEGORIES = [
  { id: 'alimentation', nom: 'Alimentation', emoji: '🍚', couleur: '#F6A94A' },
  { id: 'transport', nom: 'Transport', emoji: '🚌', couleur: '#5B8DEF' },
  { id: 'logement', nom: 'Logement', emoji: '🏠', couleur: '#8B7CF6' },
  { id: 'sante', nom: 'Santé', emoji: '💊', couleur: '#34C77B' },
  { id: 'education', nom: 'Éducation', emoji: '📚', couleur: '#F65E7A' },
  { id: 'communication', nom: 'Crédit / Internet', emoji: '📱', couleur: '#2BB8C4' },
  { id: 'famille', nom: 'Famille & soutien', emoji: '🤝', couleur: '#B58AE6' },
  { id: 'tontine', nom: 'Tontine / Épargne', emoji: '💰', couleur: '#E0B33C' },
  { id: 'loisirs', nom: 'Loisirs', emoji: '🎉', couleur: '#FF8A65' },
  { id: 'autre', nom: 'Autre', emoji: '📦', couleur: '#9A96A8' },
];

export const SOURCES_REVENU = [
  { id: 'salaire', nom: 'Salaire', emoji: '💼' },
  { id: 'commerce', nom: 'Commerce', emoji: '🛍️' },
  { id: 'transfert', nom: 'Transfert reçu', emoji: '📲' },
  { id: 'autre_revenu', nom: 'Autre', emoji: '➕' },
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
  const syncTimer = useRef(null);

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
