import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

const port = Number(process.env.PORT) || 3000;
const basePath = process.env.BASE_PATH || "/";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Read VITE_* first, then fall back to NEXT_PUBLIC_* so ops can keep their
  // existing Vercel env vars (set during the Next-flavored spec) without
  // duplicating each one. Same for APP_URL and BRAND_NAME.
  const clerkKey =
    env.VITE_CLERK_PUBLISHABLE_KEY      || process.env.VITE_CLERK_PUBLISHABLE_KEY
    || env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    || "";
  const appUrl =
    env.VITE_APP_URL      || process.env.VITE_APP_URL
    || env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL
    || "";
  const brandName =
    env.VITE_BRAND_NAME      || process.env.VITE_BRAND_NAME
    || env.NEXT_PUBLIC_BRAND_NAME || process.env.NEXT_PUBLIC_BRAND_NAME
    || "credeti";

  return {
    base: basePath,
    define: {
      "import.meta.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(clerkKey),
      "import.meta.env.VITE_APP_URL":               JSON.stringify(appUrl),
      "import.meta.env.VITE_BRAND_NAME":            JSON.stringify(brandName),
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon-64.png", "apple-touch-icon.png", "pwa-192.png", "pwa-512.png", "logo-credeti-full.jpeg"],
        manifest: {
          name: "credeti — Crédito para ti",
          short_name: "credeti",
          description: "credeti — Más que un crédito, una forma distinta de vivir.",
          theme_color: "#215DFF",
          background_color: "#06143B",
          display: "standalone",
          orientation: "portrait",
          start_url: ".",
          scope: ".",
          categories: ["finance", "business"],
          icons: [
            { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
            { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
            { src: "pwa-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
          skipWaiting: true,
          clientsClaim: true,
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
