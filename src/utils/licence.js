import nacl from 'tweetnacl';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Clé PUBLIQUE de vérification des licences.
 * Elle ne permet que de vérifier une signature, jamais d'en produire — la clé
 * privée reste sur le serveur. Doit correspondre à LICENCE_CLE_PRIVEE du backend.
 *
 * ⚠ À remplacer par la clé de production avant publication.
 */
const CLE_PUBLIQUE_B64 = 'YkV/k0cGCakhT+hbo5wQH8rMtho9K3jUvBncMh6ax1I=';

export const CLE_HORLOGE = '@budget_fcfa_horloge'; // dernière date vue (anti-recul)

const JOUR_MS = 24 * 60 * 60 * 1000;

// --- Encodage : ni Buffer ni atob ne sont garantis sous Hermes ---

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64VersOctets(b64) {
  const propre = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const out = [];
  let tampon = 0;
  let bits = 0;
  for (const car of propre) {
    const v = ALPHABET.indexOf(car);
    if (v < 0) continue;
    tampon = (tampon << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((tampon >> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
}

/** Décode de l'UTF-8 sans dépendre de TextDecoder. */
function octetsVersTexte(octets) {
  let s = '';
  for (let i = 0; i < octets.length; i++) {
    const o = octets[i];
    if (o < 0x80) {
      s += String.fromCharCode(o);
    } else if (o >= 0xc0 && o < 0xe0) {
      s += String.fromCharCode(((o & 0x1f) << 6) | (octets[++i] & 0x3f));
      } else if (o >= 0xe0 && o < 0xf0) {
      s += String.fromCharCode(
        ((o & 0x0f) << 12) | ((octets[++i] & 0x3f) << 6) | (octets[++i] & 0x3f),
      );
    } else {
      const cp =
        ((o & 0x07) << 18) |
        ((octets[++i] & 0x3f) << 12) |
        ((octets[++i] & 0x3f) << 6) |
        (octets[++i] & 0x3f);
      const d = cp - 0x10000;
      s += String.fromCharCode(0xd800 + (d >> 10), 0xdc00 + (d & 0x3ff));
    }
  }
  return s;
}

const CLE_PUBLIQUE = base64VersOctets(CLE_PUBLIQUE_B64);

/**
 * Vérifie la signature d'un jeton et renvoie sa charge utile, ou null.
 * Purement local : aucun réseau, donc utilisable hors ligne.
 */
export function verifierJeton(jeton) {
  if (typeof jeton !== 'string' || !jeton.includes('.')) return null;

  const [corpsB64, signatureB64] = jeton.split('.');
  if (!corpsB64 || !signatureB64) return null;

  try {
    const corps = base64VersOctets(corpsB64);
    const signature = base64VersOctets(signatureB64);
    if (signature.length !== nacl.sign.signatureLength) return null;

    if (!nacl.sign.detached.verify(corps, signature, CLE_PUBLIQUE)) return null;

    const charge = JSON.parse(octetsVersTexte(corps));
    if (charge.v !== 1) return null; // version de jeton inconnue
    return charge;
  } catch {
    return null; // jeton corrompu ou falsifié
  }
}

/**
 * Garde anti-recul d'horloge.
 *
 * Reculer la date du téléphone est le contournement évident de la tolérance
 * hors ligne. On mémorise la date la plus avancée jamais vue : si l'horloge
 * revient en arrière, on considère la tolérance comme consommée. Toute
 * synchronisation réussie rétablit la vérité du serveur.
 */
export async function horlogeFiable() {
  const maintenant = Date.now();
  try {
    const brut = await AsyncStorage.getItem(CLE_HORLOGE);
    const dernierVu = brut ? Number(brut) : 0;

    if (dernierVu && maintenant < dernierVu - 60_000) {
      return { maintenant, recul: true, dernierVu };
    }
    if (maintenant > dernierVu) {
      await AsyncStorage.setItem(CLE_HORLOGE, String(maintenant));
    }
    return { maintenant, recul: false, dernierVu };
  } catch {
    return { maintenant, recul: false, dernierVu: 0 };
  }
}

/**
 * Traduit un jeton en état exploitable par l'interface.
 * `saisieAutorisee` est la seule valeur dont dépend le verrouillage.
 */
export function evaluerLicence(charge, { maintenant = Date.now(), recul = false } = {}) {
  if (!charge) {
    return {
      valide: false,
      statut: 'inconnu',
      saisieAutorisee: false,
      enTolerance: false,
      joursRestants: 0,
      raison: 'aucune-licence',
    };
  }

  // Horloge reculée : on refuse le bénéfice de la tolérance, sans couper
  // l'utilisateur dont la période payée court toujours.
  const finTolerance = recul ? charge.periodeFinLe : charge.valideJusquA;

  const periodeEnCours = maintenant < charge.periodeFinLe;
  const dansTolerance = !periodeEnCours && maintenant < finTolerance;

  return {
    valide: true,
    statut: charge.statut,
    userId: charge.userId,
    periodeFinLe: charge.periodeFinLe,
    saisieAutorisee: periodeEnCours || dansTolerance,
    enTolerance: dansTolerance,
    horlogeSuspecte: recul,
    joursRestants: Math.max(0, Math.ceil((charge.periodeFinLe - maintenant) / JOUR_MS)),
    raison: periodeEnCours ? 'active' : dansTolerance ? 'tolerance' : 'expiree',
  };
}
