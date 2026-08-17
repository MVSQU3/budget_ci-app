import React, { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { memeMois, formatFCFA } from '../utils/format';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';
import { useLicence } from './LicenceContext';
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
  { id: 'salaire', nom: 'Salaire', icone: 'briefcase', couleur: '#56633f' },
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
  const { enregistrerJeton, licence } = useLicence();
  const [transactions, setTransactions] = useState([]); // inclut les tombstones
  const [budgets, setBudgets] = useState({}); // { categorieId: { montant, majLe } }
  const [charge, setCharge] = useState(false);
  const [syncEnCours, setSyncEnCours] = useState(false);
  const [derniereSync, setDerniereSync] = useState(null);
  // null = tout va bien ; sinon { type: 'reseau' | 'serveur' | 'auth', statut, message }
  const [syncErreur, setSyncErreur] = useState(null);
  const [notifPrefs, setNotifPrefs] = useState(NOTIF_DEFAUT);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const syncTimer = useRef(null);
  const syncNotifie = useRef(false); // pour ne notifier la sync en retard qu'une fois

  // Miroirs de l'état lus par `synchroniser`. Ils garantissent qu'un envoi
  // programmé pousse ce qui est vrai au moment où il part, et non ce qui l'était
  // au moment où il a été programmé.
  const transactionsRef = useRef(transactions);
  const budgetsRef = useRef(budgets);
  transactionsRef.current = transactions;
  budgetsRef.current = budgets;

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

  // Bandeau éphémère en bas d'écran (2,4 s), comme dans le design
  const flash = useCallback((message) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => () => toastTimer.current && clearTimeout(toastTimer.current), []);

  /**
   * Synchronisation avec le serveur.
   * Hors ligne (`reseau: true`) : silencieux et normal, les données restent locales.
   * Erreur renvoyée par le serveur : remontée dans `syncErreur` — jamais avalée,
   * sinon une panne de sauvegarde passe inaperçue jusqu'à la perte des données.
   */
  const synchroniser = useCallback(async ({ manuelle = false } = {}) => {
    if (!token) return;
    setSyncEnCours(true);
    try {
      // On lit l'état via des refs, jamais via la capture du closure : `planifierSync`
      // programme un envoi 2 s plus tard, et cette capture-là daterait d'AVANT la
      // modification. La sync poussait alors l'ancienne valeur, le serveur la
      // renvoyait, et l'adoption de la réponse annulait la suppression qu'on venait
      // de faire — une suppression de budget ne « tenait » jamais.
      const budgetsCourants = budgetsRef.current;
      const budgetsListe = Object.entries(budgetsCourants).map(([categorieId, b]) => ({
        categorieId,
        montant: b.montant,
        majLe: b.majLe,
      }));
      const txPoussees = transactionsRef.current;
      const res = await api.sync(txPoussees, budgetsListe, token);

      // L'état serveur est l'état fusionné : on l'adopte, en préservant ce qui a
      // été modifié pendant que la requête était en vol. Sans ça, supprimer une
      // ligne pile au moment d'une sync verrait la réponse écraser la suppression.
      const majPoussee = new Map(budgetsListe.map((b) => [b.categorieId, b.majLe]));
      const nouveauxBudgets = {};
      res.budgets.forEach((b) => {
        nouveauxBudgets[b.categorieId] = { montant: b.montant, majLe: b.majLe };
      });
      Object.entries(budgetsRef.current).forEach(([id, local]) => {
        const pousse = majPoussee.get(id);
        if (pousse === undefined || local.majLe > pousse) nouveauxBudgets[id] = local;
      });
      setBudgets(nouveauxBudgets);

      const txMajPoussee = new Map(txPoussees.map((t) => [t.id, t.majLe]));
      const parId = new Map(res.transactions.map((t) => [t.id, t]));
      transactionsRef.current.forEach((local) => {
        const pousse = txMajPoussee.get(local.id);
        if (pousse === undefined || local.majLe > pousse) parId.set(local.id, local);
      });
      setTransactions([...parId.values()]);

      setDerniereSync(res.syncLe);

      // Chaque sync réussie rafraîchit la licence et repousse la tolérance hors ligne
      if (res.abonnement?.licence) await enregistrerJeton(res.abonnement.licence);

      setSyncErreur(null);
      syncNotifie.current = false;
      if (manuelle) flash('Données synchronisées');
    } catch (e) {
      if (e.reseau) {
        // Sans connexion : cas nominal. Serveur injoignable malgré une connexion :
        // anomalie de configuration, il faut le dire plutôt que crier « hors ligne ».
        setSyncErreur({
          type: e.horsLigne ? 'reseau' : 'injoignable',
          message: e.message,
        });
        if (manuelle) {
          flash(
            e.horsLigne
              ? 'Hors ligne — la sauvegarde se fera au retour du réseau'
              : 'Serveur injoignable — vérifie son adresse',
          );
        }

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
      } else {
        // Le serveur a répondu une erreur : anomalie, il faut que ça se voie
        const type = e.statut === 401 ? 'auth' : 'serveur';
        setSyncErreur({ type, statut: e.statut, message: e.message });
        console.warn(`[sync] échec serveur ${e.statut ?? ''} : ${e.message}`);
        flash(
          type === 'auth'
            ? 'Session expirée — reconnecte-toi pour sauvegarder'
            : `Échec de la sauvegarde : ${e.message}`,
        );
      }
    } finally {
      setSyncEnCours(false);
    }
    // `transactions` et `budgets` sont volontairement absents des dépendances :
    // ils sont lus via des refs, ce qui rend cette fonction stable et évite qu'un
    // envoi programmé n'emporte une photo périmée de l'état.
  }, [token, notifPrefs.sync, derniereSync, flash, enregistrerJeton]);

  // Sync au démarrage / à la connexion
  useEffect(() => {
    if (charge && token) synchroniser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charge, token]);

  /**
   * Reprise au retour au premier plan.
   *
   * Sans ça, un échec de sync laisse l'app affichée « hors ligne » jusqu'au
   * prochain redémarrage ou à la prochaine saisie : le réseau revient, mais
   * rien ne le remarque. On retente donc dès que l'utilisateur revient sur l'app.
   */
  useEffect(() => {
    if (!charge || !token) return;
    const abonnement = AppState.addEventListener('change', (etat) => {
      if (etat === 'active') synchroniser();
    });
    return () => abonnement.remove();
  }, [charge, token, synchroniser]);

  // Sync différée après chaque modification (regroupe les changements rapprochés)
  const planifierSync = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => synchroniser(), 2000);
  }, [synchroniser]);

  /**
   * Verrou de lecture seule.
   *
   * Point de passage unique de toutes les écritures : plutôt que de compter sur
   * chaque écran pour désactiver ses boutons, on refuse ici. Un chemin d'appel
   * oublié dans l'interface ne peut donc pas contourner l'abonnement.
   * Renvoie true si l'écriture est refusée.
   */
  const ecritureBloquee = () => {
    if (licence.saisieAutorisee) return false;
    flash('Abonnement expiré — renouvelle pour enregistrer à nouveau');
    return true;
  };

  const ajouterTransaction = ({ type, montant, categorieId, note }) => {
    if (ecritureBloquee()) return false;

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
    return true;
  };

  const supprimerTransaction = (id) => {
    if (ecritureBloquee()) return false;
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, supprime: true, majLe: Date.now() } : t)),
    );
    planifierSync();
    return true;
  };

  /**
   * Efface toutes les transactions et tous les budgets, localement et sur le serveur.
   *
   * On passe par les mêmes marqueurs de suppression que la suppression unitaire,
   * et non par un vidage du stockage : vider AsyncStorage ne toucherait pas à
   * l'état en mémoire (que les effets de sauvegarde réécriraient aussitôt), et
   * surtout le serveur n'apprendrait jamais l'effacement — il rapatrierait tout
   * à la synchronisation suivante.
   *
   * Le compte, l'abonnement et les préférences de notification sont conservés :
   * l'action ne porte que sur les données financières, comme son libellé l'indique.
   *
   * Volontairement non soumis au verrou de lecture seule : effacer ses propres
   * données doit rester possible même quand l'abonnement a expiré.
   */
  const effacerToutesLesDonnees = async () => {
    const maintenant = Date.now();

    const txEffacees = transactionsRef.current.map((t) =>
      t.supprime ? t : { ...t, supprime: true, majLe: maintenant },
    );
    const budgetsEffaces = {};
    Object.keys(budgetsRef.current).forEach((id) => {
      budgetsEffaces[id] = { montant: 0, majLe: maintenant };
    });

    // Les refs sont mises à jour tout de suite : `synchroniser` les lit, et elles
    // ne seraient rafraîchies qu'au rendu suivant, après l'envoi.
    transactionsRef.current = txEffacees;
    budgetsRef.current = budgetsEffaces;
    setTransactions(txEffacees);
    setBudgets(budgetsEffaces);

    await synchroniser();
    flash('Toutes les données ont été effacées');
    return true;
  };

  /**
   * Définit le budget d'une catégorie. Un montant nul vaut suppression.
   *
   * L'entrée à 0 est volontairement conservée dans l'état local : c'est elle
   * qui, poussée avec un `majLe` récent, dit au serveur d'effacer la ligne.
   * La retirer tout de suite ferait revenir l'ancien montant à la sync suivante.
   * `budgetsSimples` la masque de l'interface, et l'adoption de l'état serveur
   * la fait disparaître une fois la suppression confirmée.
   */
  const definirBudget = (categorieId, montant) => {
    if (ecritureBloquee()) return false;
    setBudgets((prev) => ({
      ...prev,
      [categorieId]: { montant: Math.abs(Number(montant)) || 0, majLe: Date.now() },
    }));
    planifierSync();
    return true;
  };

  /** Supprime le budget d'une catégorie (montant nul = suppression). */
  const supprimerBudget = (categorieId) => definirBudget(categorieId, 0);

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
        // L'interface s'en sert pour désactiver ses commandes ; le refus réel
        // se fait dans les fonctions d'écriture ci-dessus.
        lectureSeule: !licence.saisieAutorisee,
        toast,
        flash,
        charge,
        syncEnCours,
        derniereSync,
        syncErreur,
        synchroniser,
        ajouterTransaction,
        supprimerTransaction,
        definirBudget,
        supprimerBudget,
        effacerToutesLesDonnees,
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
