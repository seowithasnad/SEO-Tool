export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/keyword-research/:path*",
    "/serp-analysis/:path*",
    "/competitor-analysis/:path*",
    "/rank-tracker/:path*",
    "/site-audit/:path*",
    "/content-optimizer/:path*",
    "/settings/:path*",
  ],
};
