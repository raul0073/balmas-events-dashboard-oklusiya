import LoginPage from "@/components/LoginPage";

export const metadata = { title: "כניסה | חמ\"ל אוכלוסייה" };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <LoginPage next={next} />;
}
