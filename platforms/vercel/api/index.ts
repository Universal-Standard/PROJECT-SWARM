/**
 * Vercel Serverless Function: API Handler
 *
 * Wraps the standalone Express app with serverless-http so all
 * /api/* requests are handled by the same Express logic, using
 * GitHub OAuth instead of Replit Auth.
 *
 * Environment variables (set in Vercel dashboard → Settings → Environment Variables):
 *   DATABASE_URL            — Neon PostgreSQL connection string
 *   SESSION_SECRET          — Random string for session signing
 *   GITHUB_CLIENT_ID        — GitHub OAuth App client ID
 *   GITHUB_CLIENT_SECRET    — GitHub OAuth App client secret
 *   GITHUB_REDIRECT_URI     — https://<project>.vercel.app/api/auth/github/callback
 *   OPENAI_API_KEY          — (optional) OpenAI API key
 *   ANTHROPIC_API_KEY       — (optional) Anthropic API key
 *   GEMINI_API_KEY          — (optional) Google Gemini API key
 *   ENCRYPTION_KEY          — Key for encrypting stored tokens
 *   ENCRYPTION_SALT         — Salt for token encryption
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import serverless from "serverless-http";
import { createStandaloneApp } from "../shared/server/standalone-app";

// Provide a dummy REPLIT_DOMAINS so any transitive imports that check it
// don't throw. The actual Replit Auth middleware is NOT registered in
// createStandaloneApp() — this is purely a guard for module loading.
process.env.REPLIT_DOMAINS = process.env.REPLIT_DOMAINS || "vercel.standalone";
process.env.PLATFORM = "vercel";

const app = createStandaloneApp();
const handler = serverless(app);

export default async function (req: VercelRequest, res: VercelResponse) {
  return handler(req, res);
}
