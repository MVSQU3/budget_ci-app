import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../utils/api';

const AUTH_KEY = '@budget_fcfa_auth';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  const [token, setToken] = useState(null);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(AUTH_KEY);
        if (raw) {
          const { token, utilisateur } = JSON.parse(raw);
          setToken(token);
          setUtilisateur(utilisateur);
        }
      } finally {
        setCharge(true);
      }
    })();
  }, []);

  const memoriser = async (accessToken, user) => {
    setToken(accessToken);
    setUtilisateur(user);
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ token: accessToken, utilisateur: user }));
  };

  const login = async (telephone, motDePasse) => {
    const res = await api.login(telephone, motDePasse);
    if (res.verificationRequise) return { verificationRequise: true };
    await memoriser(res.accessToken, res.utilisateur);
    return {};
  };

  const register = (nomUtilisateur, telephone, motDePasse) =>
    api.register(nomUtilisateur, telephone, motDePasse);

  const verifierOtp = async (telephone, code) => {
    const res = await api.verifierOtp(telephone, code);
    await memoriser(res.accessToken, res.utilisateur);
  };

  const deconnexion = async () => {
    setToken(null);
    setUtilisateur(null);
    await AsyncStorage.removeItem(AUTH_KEY);
  };

  return (
    <AuthContext.Provider
      value={{ utilisateur, token, charge, login, register, verifierOtp, renvoyerOtp: api.renvoyerOtp, deconnexion }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
