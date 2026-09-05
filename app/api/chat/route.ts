import { auth } from "@clerk/nextjs/server"
import { google } from "@ai-sdk/google"
import { and, eq } from "drizzle-orm"
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai"
import { db } from "@/lib/db"
import { games } from "@/lib/db/schema"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  const { userId, orgId } = await auth()

  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const {
    messages,
    gameId,
    id,
  }: { messages: UIMessage[]; gameId?: string; id?: string } = await req.json()

  const targetGameId = gameId || id

  const normalizedMessages: UIMessage[] = (messages || []).map((m: any) => {
    const id = m.id && String(m.id).trim() !== "" ? m.id : crypto.randomUUID()
    if (m.parts) return { ...m, id }
    return {
      ...m,
      id,
      parts: [{ type: "text", text: m.content || "" }],
    }
  })

  if (targetGameId && orgId) {
    await db
      .update(games)
      .set({ messages: normalizedMessages })
      .where(and(eq(games.id, targetGameId), eq(games.orgId, orgId)))
  }

  const result = streamText({
    model: google("gemini-3.1-flash-lite-preview"),
    messages: await convertToModelMessages(normalizedMessages),
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: normalizedMessages,
      generateMessageId: () => crypto.randomUUID(),
      onEnd: async ({ messages: updatedMessages }) => {
        const sanitized = updatedMessages.map((m) => ({
          ...m,
          id: m.id && String(m.id).trim() !== "" ? m.id : crypto.randomUUID(),
        }))
        if (targetGameId && orgId) {
          await db
            .update(games)
            .set({ messages: sanitized })
            .where(and(eq(games.id, targetGameId), eq(games.orgId, orgId)))
        }
      },
    }),
  })
}
