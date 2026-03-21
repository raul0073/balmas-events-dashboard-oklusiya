"use client";

import { useAuth } from "@/lib/auth";
import LoginPage from "@/components/LoginPage";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <LoginPage />;
  return <>{children}</>;
}
