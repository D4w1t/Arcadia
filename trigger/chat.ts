import { chat, upsertIncomingMessage } from "@trigger.dev/sdk/ai"
import { google } from "@ai-sdk/google"
import { streamText, stepCountIs, type UIMessage } from "ai"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { games } from "@/lib/db/schema"
import { createGameSandbox } from "@/lib/daytona/utils"
import { gameInstructions } from "@/lib/games/instructions"
import { createGameTools } from "@/lib/games/tools"

export const gameChat = chat.agent({
  id: "game-chat",
  tools: ({ chatId }) => createGameTools(chatId),
  onChatStart: async ({ chatId }) => {
    await createGameSandbox(chatId)
  },
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
  onBeforeTurnComplete: async ({ writer, turn }) => {
    writer.write({
      type: "data-turn-complete",
      data: { turn, timestamp: Date.now() },
      transient: true,
    } as any)
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
      // Spread first, so every option below still wins. Wires up the
      // `prepareStep` behind compaction, steering and background injection -
      // all of which silently no-op without it.
      ...chat.toStreamTextOptions({ tools }),
      model: google("gemini-3.1-flash-lite-preview"),
      // `instructions`, not the deprecated `system`. Passed here rather than
      // through `chat.prompt.set()` because the prompt is static - there is no
      // per-chat or dashboard-versioned part of it to resolve in a hook.
      instructions: gameInstructions,
      messages,
      // Fires on stop and on cancel. Without it, Stop only updates the UI.
      abortSignal: signal,
      stopWhen: stepCountIs(15),
    }),
})
