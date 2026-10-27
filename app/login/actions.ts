"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeUsername, usernameToEmail } from "@/lib/auth/username";

export interface SignInState {
  error?: string;
}

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "יש להזין שם משתמש וסיסמה" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });
  if (error) return { error: "שם משתמש או סיסמה שגויים" };

  redirect("/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
