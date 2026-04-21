/**
 * Netlify Function: API Handler
 *
 * Wraps the standalone Express app with serverless-http so all
 * /api/* requests are handled by the same Express logic as the
 * root server, but using GitHub OAuth instead of Replit Auth.
 *
 * Environment variables required (set in Netlify dashboard):
 *   DATABASE_URL            — Neon PostgreSQL connection string
 *   SESSION_SECRET          — Random string for session signing
 *   GITHUB_CLIENT_ID        — GitHub OAuth App client ID
 *   GITHUB_CLIENT_SECRET    — GitHub OAuth App client secret
 *   GITHUB_REDIRECT_URI     — https://<site>.netlify.app/api/auth/github/callback
 *   OPENAI_API_KEY          — (optional) OpenAI API key
 *   ANTHROPIC_API_KEY       — (optional) Anthropic API key
 *   GEMINI_API_KEY          — (optional) Google Gemini API key
 *   ENCRYPTION_KEY          — Key for encrypting stored tokens
 *   ENCRYPTION_SALT         — Salt for token encryption
 */

import type { Handler } from "@netlify/functions";
import serverless from "serverless-http";
import { createStandaloneApp } from "../../shared/server/standalone-app";

// Provide a dummy REPLIT_DOMAINS so any transitive imports that check it
// don't throw. The actual Replit Auth middleware is NOT registered in
// createStandaloneApp() — this is purely a guard for module loading.
process.env.REPLIT_DOMAINS = process.env.REPLIT_DOMAINS || "netlify.standalone";
process.env.PLATFORM = "netlify";

const app = createStandaloneApp();
const handler = serverless(app);

export { handler };
