import "dotenv/config"
import { drizzle } from "drizzle-orm/mysql2"
import mysql from "mysql2/promise"

import * as schema from "./schema"

const globalForDb = globalThis as unknown as {
  mysqlPool?: mysql.Pool
}

export const pool =
  globalForDb.mysqlPool ??
  mysql.createPool({
    uri: process.env.DATABASE_URL,
    connectionLimit: 5,
    waitForConnections: true,
  })

if (process.env.NODE_ENV !== "production") {
  globalForDb.mysqlPool = pool
}

export const db = drizzle(pool, {
  schema,
  mode: "default",
})
