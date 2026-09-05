import { auth } from "@clerk/nextjs/server"
import { and, desc, eq } from "drizzle-orm"
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

export async function getGame(id: string): Promise<Game | undefined> {
  const { orgId } = await auth()

  if (!orgId) {
    return undefined
  }

  const [game] = await db
    .select()
    .from(games)
    .where(and(eq(games.id, id), eq(games.orgId, orgId)))
    .limit(1)

  return game
}
