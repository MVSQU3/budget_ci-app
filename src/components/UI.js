import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  colors, radius, shadow, shadowMoyenne, shadowForte, fonts, gradients,
} from '../theme/theme';

/** Carte blanche arrondie — base de tous les écrans du design Organic. */
export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Carte à dégradé pêche → vert pâle (carte de solde de l'accueil). */
export function GradientCard({ children, style, colors: grad = gradients.solde }) {
  return (
    <LinearGradient
      colors={grad}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.gradientCard, style]}
    >
      {/* Cercle décoratif en haut à droite, comme dans le design */}
      <View style={styles.blob} pointerEvents="none" />
      {children}
    </LinearGradient>
  );
}

/** Bouton pilule terracotta pleine largeur (action principale). */
export function Bouton({ title, onPress, style, textStyle, disabled, variante = 'accent' }) {
  const fond = variante === 'vert' ? colors.vert : colors.accent;
  const texte = variante === 'vert' ? colors.surVert : colors.surAccent;
  return (
    <TouchableOpacity
      style={[styles.bouton, { backgroundColor: fond }, disabled && { opacity: 0.4 }, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      {typeof title === 'string'
        ? <Text style={[styles.boutonText, { color: texte }, textStyle]}>{title}</Text>
        : title}
    </TouchableOpacity>
  );
}

// Alias conservé : l'ancien « bouton sombre » est devenu la pilule terracotta
export const DarkButton = Bouton;

/** Puce de catégorie : blanche au repos, remplie de la couleur de catégorie une fois choisie. */
export function Chip({ label, icone, active, onPress, color }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.chip, active && { backgroundColor: color || colors.accent }]}
    >
      {icone && (
        <Ionicons name={icone} size={14} color={active ? '#fff' : color || colors.text} />
      )}
      <Text style={[styles.chipText, active && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Puce de filtre (barre de l'historique) : terracotta quand active. */
export function ChipFiltre({ label, icone, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.filtre, active && { backgroundColor: colors.accent }]}
    >
      {icone && (
        <Ionicons name={icone} size={14} color={active ? colors.surAccent : colors.text} />
      )}
      <Text style={[styles.filtreText, active && { color: colors.surAccent }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Gros titre d'écran, en Caprasimo. */
export function ScreenTitle({ children, style }) {
  return <Text style={[styles.screenTitle, style]}>{children}</Text>;
}

/** Titre de section (« Ce mois », « Récent »…), Caprasimo plus petit. */
export function TitreSection({ children, style }) {
  return <Text style={[styles.titreSection, style]}>{children}</Text>;
}

/** Bouton rond blanc à icône colorée (Dépense / Revenu / Budgets). */
export function ActionRonde({ icone, label, color, onPress }) {
  return (
    <TouchableOpacity style={styles.action} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.actionIcon}>
        <Ionicons name={icone} size={20} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Bouton circulaire discret (retour, fermer…). */
export function BoutonRond({ icone, onPress, taille = 42, style }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.rond, { width: taille, height: taille, borderRadius: taille / 2 }, style]}
    >
      <Ionicons name={icone} size={Math.round(taille * 0.43)} color={colors.text} />
    </TouchableOpacity>
  );
}

/** Interrupteur du design : piste terracotta et pastille qui glisse. */
export function Interrupteur({ value, onValueChange }) {
  const anim = React.useRef(new Animated.Value(value ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [value, anim]);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onValueChange(!value)}
      style={[styles.piste, { backgroundColor: value ? colors.accent : colors.borderFort }]}
    >
      <Animated.View
        style={[
          styles.pastille,
          {
            transform: [
              { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 19] }) },
            ],
          },
        ]}
      />
    </TouchableOpacity>
  );
}

/** Bandeau éphémère en bas d'écran. */
export function Toast({ message, bas = 120 }) {
  const anim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!message) return;
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [message, anim]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          bottom: bas,
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
          ],
        },
      ]}
    >
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.carte,
    padding: 16,
    ...shadow,
  },
  gradientCard: {
    borderRadius: radius.card,
    padding: 22,
    overflow: 'hidden',
    ...shadowMoyenne,
  },
  blob: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(198,113,57,0.10)',
    top: -58,
    right: -38,
  },
  bouton: {
    borderRadius: radius.pilule,
    paddingVertical: 17,
    alignItems: 'center',
    ...shadowMoyenne,
  },
  boutonText: { fontFamily: fonts.bold, fontSize: 15 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: radius.pilule,
    backgroundColor: colors.card,
    ...shadow,
  },
  chipText: { color: colors.text, fontFamily: fonts.bold, fontSize: 12 },
  filtre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: radius.pilule,
    backgroundColor: colors.card,
    marginRight: 8,
    ...shadow,
  },
  filtreText: { color: colors.text, fontFamily: fonts.bold, fontSize: 12.5 },
  screenTitle: { fontSize: 27, fontFamily: fonts.display, color: colors.text, lineHeight: 34 },
  titreSection: { fontSize: 18, fontFamily: fonts.display, color: colors.text, lineHeight: 24 },
  action: { flex: 1, alignItems: 'center', gap: 7 },
  actionIcon: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', ...shadowMoyenne,
  },
  actionLabel: { fontSize: 11.5, fontFamily: fonts.bold, color: colors.text },
  rond: {
    backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
    ...shadow,
  },
  piste: {
    width: 46, height: 27, borderRadius: 999,
    padding: 3, justifyContent: 'center',
  },
  pastille: { width: 21, height: 21, borderRadius: 999, backgroundColor: '#fff' },
  toast: {
    position: 'absolute', left: 20, right: 20,
    backgroundColor: colors.toast,
    borderRadius: 20,
    paddingVertical: 14, paddingHorizontal: 18,
    zIndex: 90,
    ...shadowForte,
  },
  toastText: { color: colors.surToast, fontSize: 13, fontFamily: fonts.semi },
});
