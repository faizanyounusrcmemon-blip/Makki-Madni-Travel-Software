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
    env.VITE_GITHUB_REPO_BACKEND ||
    "makki-madni-backend";

  const commitSha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    env.VITE_VERCEL_GIT_COMMIT_SHA ||
    "main";

  const commitMsg =
    process.env.VERCEL_GIT_COMMIT_MESSAGE ||
    env.VITE_VERCEL_GIT_COMMIT_MESSAGE ||
    "System Update Applied";

  const buildTime =
    process.env.VERCEL_GIT_COMMIT_TIMESTAMP ||
    env.VITE_BUILD_TIME ||
    new Date().toISOString();

  return {
    plugins: [react()],

    define: {
      "process.env.BUILD_TIME": JSON.stringify(buildTime),
      "process.env.COMMIT_MSG": JSON.stringify(commitMsg),

      "process.env.GITHUB_OWNER":
        JSON.stringify(repoOwner),

      "process.env.GITHUB_REPO_FRONTEND":
        JSON.stringify(repoFrontend),

      "process.env.GITHUB_REPO_BACKEND":
        JSON.stringify(repoBackend),

      "process.env.GITHUB_COMMIT_SHA":
        JSON.stringify(commitSha),
    },
  };
});
