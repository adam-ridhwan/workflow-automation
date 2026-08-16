import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from '@convex-dev/auth/nextjs/server';
import { NextResponse } from 'next/server';

const isAuthPage = createRouteMatcher(['/signin', '/signup']);

/** Convex document ids are 32 lowercase base32 characters. A bare `/{id}` URL is
 * shorthand for a published page; it's rewritten to the standalone
 * `/p/[pageId]` route, which would otherwise be swallowed by `/[workspaceName]`.
 * The URL stays bare. */
const CONVEX_ID = /^[a-z0-9]{32}$/;

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const isAuthenticated = await convexAuth.isAuthenticated();
  if (isAuthPage(request)) {
    if (isAuthenticated) {
      return nextjsMiddlewareRedirect(request, '/');
    }
    return;
  }
  if (!isAuthenticated) {
    return nextjsMiddlewareRedirect(request, '/signin');
  }

  // Signed in: serve a bare /{id} URL as its published page.
  const segments = request.nextUrl.pathname.split('/').filter(Boolean);
  if (segments.length === 1 && CONVEX_ID.test(segments[0])) {
    const url = request.nextUrl.clone();
    url.pathname = `/p/${segments[0]}`;
    return NextResponse.rewrite(url);
  }
});

export const config = {
  // Run on all routes except static assets.
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
