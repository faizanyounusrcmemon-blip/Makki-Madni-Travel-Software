import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const repoOwner =
    process.env.VERCEL_GIT_REPO_OWNER ||
    env.VITE_GITHUB_OWNER ||
    "faizanyounusrcmemon-blip";

  const repoFrontend =
    process.env.VERCEL_GIT_REPO_SLUG ||
    env.VITE_GITHUB_REPO_FRONTEND ||
    "Makki-Madni-Travel-Software";

  const repoBackend =
    env.VITE_GITHUB_REPO_BACKEND || "makki-madni-backend";

  const commitSha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    env.VITE_VERCEL_GIT_COMMIT_SHA ||
    "main";

  return {
    plugins: [react()],

    define: {
      __MMT_BUILD_TIME__: JSON.stringify(
        process.env.VERCEL_GIT_COMMIT_TIMESTAMP ||
          env.VITE_BUILD_TIME ||
          new Date().toISOString()
      ),
      __MMT_GITHUB_OWNER__: JSON.stringify(repoOwner),
      __MMT_GITHUB_REPO_FRONTEND__: JSON.stringify(repoFrontend),
      __MMT_GITHUB_REPO_BACKEND__: JSON.stringify(repoBackend),
      __MMT_GITHUB_COMMIT_SHA__: JSON.stringify(commitSha),
    },
  };
});
