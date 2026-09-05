import { auth } from "@clerk/nextjs/server"
import { desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { games, type Game } from "@/lib/db/schema"

export async function listGames(): Promise<Game[]> {
  const { orgId } = await auth()

  if (!orgId) {
    return []
  }

  return db
    .select()
    .from(games)
    .where(eq(games.orgId, orgId))
    .orderBy(desc(games.createdAt))
}

export const liseGames = listGames
