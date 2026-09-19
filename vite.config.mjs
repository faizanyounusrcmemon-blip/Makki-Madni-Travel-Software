import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],

    define: {
      // =====================================================
      // FIXED SYSTEM BUILD / UPDATE TIME
      // Vercel deployment ka commit time browser-side
      // Dashboard.jsx mein available hoga.
      // Ye value deployment ke waqt fix hogi aur clock ki
      // tarah continuously change nahi hogi.
      // =====================================================
      __MMT_BUILD_TIME__: JSON.stringify(
        process.env.VERCEL_GIT_COMMIT_TIMESTAMP ||
          env.VITE_BUILD_TIME ||
          new Date().toISOString()
      ),
    },
  };
});
