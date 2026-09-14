import { chat, upsertIncomingMessage } from "@trigger.dev/sdk/ai"
import { google } from "@ai-sdk/google"
import { streamText, type UIMessage } from "ai"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { games } from "@/lib/db/schema"

export const gameChat = chat.agent({
  id: "game-chat",
  hydrateMessages: async ({ chatId, trigger, incomingMessages }) => {
    const [game] = await db
      .select({ messages: games.messages })
      .from(games)
      .where(eq(games.id, chatId))
      .limit(1)

    const stored = ((game?.messages ?? []) as UIMessage[]).map((m: any) => ({
      ...m,
      id: m.id && String(m.id).trim() !== "" ? m.id : crypto.randomUUID(),
    }))

    if (upsertIncomingMessage(stored, { trigger, incomingMessages })) {
      await db
        .update(games)
        .set({ messages: stored })
        .where(eq(games.id, chatId))
    }

    return stored
  },
  onTurnComplete: async ({ chatId, uiMessages, lastEventId }) => {
    const sanitized = uiMessages.map((m) => ({
      ...m,
      id: m.id && String(m.id).trim() !== "" ? m.id : crypto.randomUUID(),
    }))

    await db
      .update(games)
      .set({
        messages: sanitized,
        lastEventId: lastEventId ?? null,
      })
      .where(eq(games.id, chatId))
  },
  run: async ({ messages, tools, signal }) =>
    streamText({
      ...chat.toStreamTextOptions({ tools }),
      model: google("gemini-3.1-flash-lite-preview"),
      messages,
      abortSignal: signal,
    }),
})
