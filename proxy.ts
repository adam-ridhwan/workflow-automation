import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from '@convex-dev/auth/nextjs/server';

const isAuthPage = createRouteMatcher(['/signin', '/signup']);

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
});

export const config = {
  // Run on all routes except static assets.
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
