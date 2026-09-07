import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// 🔥 NEW: Definining which routes are public (crawlable by Google)
const isPublicRoute = createRouteMatcher([
  '/', 
  '/background-remover',
  '/api/clerk-webhook' // If you are using any clerk webhooks later
]);

export default clerkMiddleware((auth, request) => {
  // 🔥 NEW: Check if the route is public, if NOT, protect it
  if(!isPublicRoute(request)){
    auth().protect();
  }
});

export const config = {
  matcher: [
    // 🔥 FIXED: Added txt and xml so Clerk skips robots.txt and sitemap.xml
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|xml|txt)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};  

