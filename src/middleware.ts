import { type NextRequest, NextResponse } from "next/server";

// Check if Supabase is properly configured
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const IS_SUPABASE_CONFIGURED = 
  SUPABASE_URL?.includes('placeholder') === false && 
  SUPABASE_URL?.startsWith('http') === true &&
  (SUPABASE_ANON_KEY?.length ?? 0) > 20;

export async function middleware(request: NextRequest) {
  // Skip middleware if Supabase is not configured (offline mode)
  if (!IS_SUPABASE_CONFIGURED) {
    return NextResponse.next();
  }

  // Full Supabase auth flow when configured
  let supabaseResponse = request.nextUrl.clone();

  const { createServerClient } = await import("@supabase/ssr");
  
  const supabase = createServerClient(
    SUPABASE_URL!,
    SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
        },
      },
    }
  );

  // Do not run code when the user is signing in or verifying their account
  if (request.nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.next();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // If the user is signed in, continue to the requested page
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
