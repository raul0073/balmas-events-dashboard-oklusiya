import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { EventsProvider } from "@/lib/events-context";
import { LogProvider } from "@/lib/logger";
import Navbar from "@/components/Navbar";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "מרכז פיקוד אירועים | פיקוד העורף",
  description: "מערכת ניהול אירועי חירום - משאקי אוקלוסיה",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body>
        <LogProvider>
          <EventsProvider>
            <Navbar />
            <main>{children}</main>
          </EventsProvider>
        </LogProvider>
      </body>
    </html>
  );
}
