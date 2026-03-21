"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const CREDENTIALS = {
  username: process.env.NEXT_PUBLIC_APP_USERNAME,
  password: process.env.NEXT_PUBLIC_APP_PASSWORD,
} as const;

const SESSION_KEY = "crisis-auth";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored === "1") setIsAuthenticated(true);
    setChecked(true);
  }, []);

  const login = useCallback((username: string, password: string): boolean => {
    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  }, []);

  if (!checked) return null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
