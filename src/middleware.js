import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // 🔥 Skip Next.js internals, static files, images, AND specifically robots.txt & sitemap.xml
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|xml|txt)).*)",
    
    // 🔥 Make sure the root home page is explicitly matched/skipped correctly if needed
    // Run middleware on all API routes
    "/(api|trpc)(.*)",
  ],
};
