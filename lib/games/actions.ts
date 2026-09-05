"use server"

import { auth } from "@clerk/nextjs/server"
import { refresh, revalidatePath } from "next/cache"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { db } from "@/lib/db"
import { games } from "@/lib/db/schema"

export async function createGame(
  input: string | { title?: string; prompt?: string }
) {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error("Unauthorized: Active organization required")
  }

  const prompt = (
    typeof input === "string" ? input : input?.title || input?.prompt || ""
  ).trim()
  if (!prompt) {
    throw new Error("Game description cannot be empty")
  }

  let title = prompt

  try {
    const { text } = await generateText({
      model: google("gemini-3.1-flash-lite-preview"),
      system:
        "Generate a concise, catchy, and creative game title (2 to 4 words) based on the user's game idea. Output ONLY the title, with no quotation marks or surrounding punctuation.",
      prompt,
    })

    const cleaned = text.trim().replace(/^["']|["']$/g, "")
    if (cleaned) {
      title = cleaned
    }
  } catch (error) {
    console.error(
      "Failed to generate title with AI, falling back to prompt:",
      error
    )
  }

  const [game] = await db
    .insert(games)
    .values({
      orgId,
      title,
    })
    .returning()

  revalidatePath("/", "layout")
  refresh()

  return game
}
