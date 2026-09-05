"use server"

import { auth } from "@clerk/nextjs/server"
import { refresh, revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { games } from "@/lib/db/schema"

export async function createGame(input: string | { title: string }) {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error("Unauthorized: Active organization required")
  }

  const title = typeof input === "string" ? input : input?.title
  if (!title?.trim()) {
    throw new Error("Game title cannot be empty")
  }

  const [game] = await db
    .insert(games)
    .values({
      orgId,
      title: title.trim(),
    })
    .returning()

  revalidatePath("/", "layout")
  refresh()

  return game
}
