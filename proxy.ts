import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isProtectedPath } from "@/lib/tools";

/**
 * Runs on every request: refreshes the Supabase session cookie and sends signed-out
 * visitors of protected tools to /login, remembering where they were going.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/(\.supabase\.co)\/.*$/, "$1"),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // The same server-side check the page layouts use, so gate and page never disagree.
  const { data: { user } } = await supabase.auth.getUser();
  const signedIn = Boolean(user);
  const path     = request.nextUrl.pathname;

  if (!signedIn && isProtectedPath(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  // /login is always reachable, even with a session cookie: the page itself shows
  // who is signed in, and signing in again simply replaces a stale session.
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
