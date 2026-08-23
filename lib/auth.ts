import { betterAuth } from "better-auth";
import { Pool } from "pg";

const configuredSecret = process.env.BETTER_AUTH_SECRET;

const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";

if (
  process.env.NODE_ENV === "production" &&
  !configuredSecret &&
  !isProductionBuild
) {
  throw new Error("BETTER_AUTH_SECRET is required in production");
}

export const auth = betterAuth({
  secret:
    configuredSecret ||
    "pavodah-local-development-only-secret-change-before-production",
  database: new Pool({
    connectionString: process.env.BETTER_AUTH_DATABASE_URL,
  }),
  socialProviders: {
    google: {
      profile: "select_account",
      accessType: "offline",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  trustedOrigins: [
    "http://localhost:3001",
    "http://localhost:3000", // Backend URL
  ],
});

export type Session = typeof auth.$Infer.Session;
