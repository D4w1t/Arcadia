import { config } from "dotenv"

config({ path: ".env.local" })

import { parseEnv } from "@neon/env"
import { defineConfig } from "drizzle-kit"

import neonconfig from "./neon"

// Direct (unpooled) connection - migrations must not go through PgBouner
const { postgres } = parseEnv(neonconfig, ["DATABASE_URL_UNPOOLED"])

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: postgres.databaseUrlUnpooled,
  },
})
