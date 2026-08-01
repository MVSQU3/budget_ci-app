import React from 'react';
import { View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
} from '@expo-google-fonts/figtree';
import { Caprasimo_400Regular } from '@expo-google-fonts/caprasimo';
import { BudgetProvider, useBudget } from './src/context/BudgetContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LicenceProvider } from './src/context/LicenceContext';
import { colors } from './src/theme/theme';
import BarreOnglets from './src/components/BarreOnglets';
import { Toast } from './src/components/UI';

import AccueilScreen from './src/screens/AccueilScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import BudgetsScreen from './src/screens/BudgetsScreen';
import StatsScreen from './src/screens/StatsScreen';
import CompteScreen from './src/screens/CompteScreen';
import SaisieScreen from './src/screens/SaisieScreen';
import ConnexionScreen from './src/screens/ConnexionScreen';
import InscriptionScreen from './src/screens/InscriptionScreen';
import VerificationScreen from './src/screens/VerificationScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Fond crème du design partout, y compris pendant les transitions d'écran
const themeNavigation = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.background, card: colors.card },
};

function Onglets({ navigation }) {
  const { lectureSeule, flash } = useBudget();

  // En lecture seule on n'ouvre pas l'écran de saisie pour le voir refuser :
  // on explique tout de suite pourquoi c'est bloqué.
  const ajouter = () =>
    lectureSeule
      ? flash('Abonnement expiré — renouvelle pour enregistrer à nouveau')
      : navigation.navigate('Saisie', { type: 'depense' });

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
      tabBar={(props) => (
        <BarreOnglets {...props} onAjouter={ajouter} lectureSeule={lectureSeule} />
      )}
    >
      <Tab.Screen name="Accueil" component={AccueilScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Budgets" component={BudgetsScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Compte" component={CompteScreen} />
    </Tab.Navigator>
  );
}

function Racine() {
  const { utilisateur, charge } = useAuth();
  if (!charge) return null; // chargement du token stocké

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    >
      {utilisateur ? (
        <>
          <Stack.Screen name="Onglets" component={Onglets} />
          <Stack.Screen
            name="Saisie"
            component={SaisieScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Connexion" component={ConnexionScreen} />
          <Stack.Screen name="Inscription" component={InscriptionScreen} />
          <Stack.Screen name="Verification" component={VerificationScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

// Le bandeau de confirmation flotte au-dessus de toute l'app
function CoucheToast() {
  const { toast } = useBudget();
  return <Toast message={toast} />;
}

export default function App() {
  const [polices] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_800ExtraBold,
    Caprasimo_400Regular,
  });
  if (!polices) return null; // splash le temps du chargement des polices

  return (
    <SafeAreaProvider>
      <AuthProvider>
        {/* LicenceProvider avant BudgetProvider : la sync y dépose le jeton rafraîchi */}
        <LicenceProvider>
          <BudgetProvider>
            <View style={{ flex: 1, backgroundColor: colors.background }}>
              <NavigationContainer theme={themeNavigation}>
                <StatusBar style="dark" />
                <Racine />
              </NavigationContainer>
              <CoucheToast />
            </View>
          </BudgetProvider>
        </LicenceProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
