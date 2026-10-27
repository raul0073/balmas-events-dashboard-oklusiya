import { ShieldOff } from "lucide-react";

/** Shown to a signed-in battalion whose account was disabled or never set up. */
export default function DisabledAccount() {
  return (
    <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-pikud-cream px-4">
      <div className="text-center bg-white rounded-2xl p-10 max-w-sm border border-pikud-gray-light shadow-sm">
        <ShieldOff className="w-12 h-12 text-pikud-gray-mid mx-auto mb-4" />
        <p className="text-pikud-navy font-bold text-lg mb-2">החשבון אינו פעיל</p>
        <p className="text-pikud-gray-mid text-sm">חשבון הגדוד הושבת או טרם הוגדר. פנה למנהל המערכת.</p>
      </div>
    </div>
  );
}
