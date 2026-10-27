import Link from "next/link";
import { loadSession } from "@/lib/auth/session";
import LoginPage from "@/components/LoginPage";
import { signOut } from "@/app/login/actions";
import { ShieldCheck, LogOutIcon, ArrowLeft } from "lucide-react";

export const metadata = { title: "כניסה | חמ\"ל אוכלוסייה" };

function safeNext(raw: string | undefined): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const session = await loadSession();

  if (!session) return <LoginPage next={next} />;

  const target = session.isAdmin ? "/admin" : safeNext(next);
  const who    = session.battalion?.name ?? (session.isAdmin ? "מנהל המערכת" : session.username);

  return (
    <div className="min-h-screen bg-pikud-navy flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-pikud-navy px-8 pt-8 pb-6 text-center border-b-4 border-pikud-orange">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-pikud-orange rounded-2xl mb-4 shadow-lg">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-white font-black text-xl leading-tight">כבר מחובר</h1>
          <p className="text-white/60 text-sm mt-1">{who}<span className="text-white/40" dir="ltr"> · {session.username}</span></p>
        </div>
        <div className="px-8 py-7 space-y-3">
          <Link href={target}
            className="w-full h-11 inline-flex items-center justify-center gap-2 bg-pikud-orange hover:bg-pikud-orange-dark text-white font-bold rounded-lg transition-colors">
            המשך <ArrowLeft className="w-4 h-4" />
          </Link>
          <form action={signOut}>
            <button type="submit"
              className="w-full h-11 inline-flex items-center justify-center gap-2 border border-pikud-gray-light text-pikud-navy font-semibold rounded-lg hover:bg-pikud-cream transition-colors">
              <LogOutIcon className="w-4 h-4" /> התנתק וכנס כמשתמש אחר
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
