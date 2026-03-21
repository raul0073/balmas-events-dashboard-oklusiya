import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { EventsProvider } from "@/lib/events-context";
import { LogProvider } from "@/lib/logger";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/lib/auth";
import AuthGuard from "@/components/AuthGuard";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "מרכז פיקוד אירועים | פיקוד העורף",
  description: `גדוד 996 חמ"ל אוכלוסיה`
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body>
        <LogProvider>
          <AuthProvider>
    <AuthGuard>

          <EventsProvider>
            <Navbar />
            <main>{children}</main>
          </EventsProvider>
    </AuthGuard>
          </AuthProvider>
        </LogProvider>
      </body>
    </html>
  );
}
