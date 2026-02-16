import { createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";

type TursoClientCache = {
  cacheKey: string;
  db: LibSQLDatabase;
};

let cachedClient: TursoClientCache | null = null;
type TursoClientConfig = Parameters<typeof createClient>[0];

function getClientConfig(): TursoClientConfig | null {
  if (typeof window !== "undefined") {
    return null;
  }

  const url = process.env.TURSO_DATABASE_URL?.trim();
  if (!url) {
    return null;
  }

  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
  if (!authToken) {
    return { url };
  }

  return { url, authToken };
}

export function getTursoDb(): LibSQLDatabase | null {
  const config = getClientConfig();
  if (!config) {
    return null;
  }

  const cacheKey = `${config.url}:${config.authToken ?? ""}`;
  if (cachedClient?.cacheKey === cacheKey) {
    return cachedClient.db;
  }

  const client = createClient(config);
  const db = drizzle(client);
  cachedClient = { cacheKey, db };
  return db;
}

export function resetTursoClientForTests(): void {
  cachedClient = null;
}
