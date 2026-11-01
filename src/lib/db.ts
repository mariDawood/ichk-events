import "server-only";
import postgres from "postgres";

const globalForSql = globalThis as unknown as {
  sql?: ReturnType<typeof postgres>;
};

function createSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  return postgres(url, {
    ssl: "require",
    max: 1,
    max_pipeline: 1,
    prepare: false,
    fetch_types: false,
    idle_timeout: 20,
    connect_timeout: 10,
    queue_timeout: 8,
  });
}

export const sql = globalForSql.sql ?? createSql();

if (process.env.NODE_ENV !== "production") {
  globalForSql.sql = sql;
}
