import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16 calls middleware "proxy". This adds the locale prefix (/ → /ar).
// Step 4 adds the session check here that sends each role to its own area.
export default createMiddleware(routing);

export const config = {
  // Everything except API routes, Next internals, and files with an extension.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
