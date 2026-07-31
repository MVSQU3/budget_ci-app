import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme/theme';

// Icônes Ionicons correspondant aux icônes Lucide du design
const ICONES = {
  Accueil: 'home',
  Transactions: 'receipt',
  Budgets: 'flag',
  Stats: 'pie-chart',
  Compte: 'person',
};

/**
 * Barre d'onglets du design : bandeau blanc de 88 px à coins hauts arrondis (30),
 * surmonté du bouton d'ajout terracotta centré.
 */
export default function BarreOnglets({ state, navigation, onAjouter }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.conteneur} pointerEvents="box-none">
      <View style={[styles.barre, { height: 88 + insets.bottom, paddingBottom: insets.bottom }]}>
        {state.routes.map((route, index) => {
          const actif = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!actif && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={actif ? { selected: true } : {}}
              accessibilityLabel={route.name}
              onPress={onPress}
              style={styles.onglet}
              activeOpacity={0.7}
            >
              <Ionicons
                name={ICONES[route.name]}
                size={21}
                color={actif ? colors.accent : colors.textFaint}
              />
              <Text style={[styles.label, { color: actif ? colors.accentLien : colors.textFaint }]}>
                {route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bouton d'ajout central, posé au-dessus de la barre */}
      <TouchableOpacity
        style={[styles.fab, { bottom: 62 + insets.bottom }]}
        onPress={onAjouter}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Ajouter une dépense"
      >
        <Ionicons name="add" size={30} color={colors.surAccent} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  barre: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 14,
    paddingTop: 18,
    shadowColor: '#2e2b25',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -3 },
    elevation: 16,
  },
  onglet: { flex: 1, alignItems: 'center', gap: 5 },
  label: { fontSize: 9.5, fontFamily: fonts.bold },
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8c491a',
    shadowOpacity: 0.42,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
});
