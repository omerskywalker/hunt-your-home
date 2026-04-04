import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "photos.zillowstatic.com" },
      { protocol: "https", hostname: "**.zillowstatic.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },
};

// Only wrap with Sentry when DSN is configured — no-ops otherwise
const sentryOptions = {
  silent: true,
  disableLogger: true,
  // Disable source map upload unless SENTRY_AUTH_TOKEN is set
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
};

export default process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryOptions)
  : nextConfig;
