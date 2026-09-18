"use server"

import { auth as clerkAuth } from "@clerk/nextjs/server"
import { getGameSandbox, startGameServer } from "@/lib/daytona/utils"

export async function getGamePreviewUrl(gameId: string): Promise<{ url: string }> {
  const { userId } = await clerkAuth()
  if (!userId) {
    throw new Error("Unauthorized")
  }

  // Retrieve the ready sandbox instance for this game
  const { sandbox } = await getGameSandbox(gameId)

  // Ensure python http server is running on port 3000
  await startGameServer(sandbox)

  // Mint signed preview URL
  try {
    const signed = await sandbox.getSignedPreviewUrl(3000, 3600)
    return { url: signed.url }
  } catch {
    const preview = await sandbox.getPreviewLink(3000)
    return { url: preview.url }
  }
}
