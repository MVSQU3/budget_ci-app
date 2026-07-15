import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import { BudgetProvider } from './src/context/BudgetContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { colors, fonts } from './src/theme/theme';

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

// Icônes vectorielles de la barre d'onglets (style fin des maquettes)
const ICONES = {
  Accueil: ['home-outline', 'home'],
  Transactions: ['receipt-outline', 'receipt'],
  Budgets: ['flag-outline', 'flag'],
  Stats: ['stats-chart-outline', 'stats-chart'],
  Compte: ['person-outline', 'person'],
};

function Onglets() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          elevation: 8,
          height: 62,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontFamily: fonts.semi, fontSize: 10 },
        tabBarIcon: ({ focused, color }) => (
          <Ionicons
            name={focused ? ICONES[route.name][1] : ICONES[route.name][0]}
            size={22}
            color={color}
          />
        ),
      })}
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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {utilisateur ? (
        <>
          <Stack.Screen name="Onglets" component={Onglets} />
          <Stack.Screen name="Saisie" component={SaisieScreen} options={{ presentation: 'modal' }} />
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

export default function App() {
  const [polices] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });
  if (!polices) return null; // splash le temps du chargement des polices

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <BudgetProvider>
          <NavigationContainer>
            <StatusBar style="dark" />
            <Racine />
          </NavigationContainer>
        </BudgetProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
