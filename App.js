import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BudgetProvider } from './src/context/BudgetContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { colors } from './src/theme/theme';

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

const ICONES = {
  Accueil: '🏠',
  Transactions: '🧾',
  Budgets: '🎯',
  Stats: '📊',
  Compte: '👤',
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
        tabBarLabelStyle: { fontWeight: '600', fontSize: 10 },
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>
            {ICONES[route.name]}
          </Text>
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
