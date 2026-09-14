"use server"

import { auth as clerkAuth } from "@clerk/nextjs/server"
import { auth as triggerAuth } from "@trigger.dev/sdk"
import { chat } from "@trigger.dev/sdk/ai"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { games } from "@/lib/db/schema"
import type { gameChat } from "@/trigger/chat"

const baseStartSession = chat.createStartSessionAction<typeof gameChat>("game-chat")

export async function startChatSession(params: {
  chatId: string
  clientData?: any
}) {
  const { userId, orgId } = await clerkAuth()
  if (!userId) {
    throw new Error("Unauthorized")
  }

  if (params.chatId && orgId) {
    const [game] = await db
      .select({ id: games.id })
      .from(games)
      .where(and(eq(games.id, params.chatId), eq(games.orgId, orgId)))
      .limit(1)

    if (!game) {
      throw new Error("Game not found or unauthorized")
    }
  }

  return baseStartSession(params)
}

export async function mintChatAccessToken(chatId: string) {
  const { userId, orgId } = await clerkAuth()
  if (!userId) {
    throw new Error("Unauthorized")
  }

  if (chatId && orgId) {
    const [game] = await db
      .select({ id: games.id })
      .from(games)
      .where(and(eq(games.id, chatId), eq(games.orgId, orgId)))
      .limit(1)

    if (!game) {
      throw new Error("Game not found or unauthorized")
    }
  }

  return triggerAuth.createPublicToken({
    scopes: {
      read: { sessions: chatId },
      write: { sessions: chatId },
    },
    expirationTime: "1h",
  })
}

export async function getChatSession(chatId: string) {
  const { userId, orgId } = await clerkAuth()
  if (!userId) {
    throw new Error("Unauthorized")
  }

  const [game] = await db
    .select({
      id: games.id,
      lastEventId: games.lastEventId,
      messages: games.messages,
    })
    .from(games)
    .where(and(eq(games.id, chatId), orgId ? eq(games.orgId, orgId) : undefined))
    .limit(1)

  if (!game) {
    throw new Error("Game not found")
  }

  return {
    lastEventId: game.lastEventId ?? undefined,
    messages: game.messages,
  }
}

