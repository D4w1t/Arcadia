import { notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { getGame } from "@/lib/games/queries"
import { mintChatAccessToken } from "@/app/actions/chat"
import { getGamePreviewUrl } from "@/app/actions/preview"
import { GameChat } from "@/components/game-chat"

export default async function GamePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ prompt?: string }>
}) {
  await auth.protect()
  const { id } = await params
  const { prompt } = await searchParams

  const game = await getGame(id)
  if (!game) {
    notFound()
  }

  const initialToken = await mintChatAccessToken(game.id)

  let initialPreviewUrl: string | null = null
  if (game.sandboxId) {
    try {
      const preview = await getGamePreviewUrl(game.id)
      initialPreviewUrl = preview.url
    } catch (e) {
      console.error("[GamePage] Failed to fetch initial preview URL:", e)
    }
  }

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <GameChat
        gameId={game.id}
        sandboxId={game.sandboxId}
        initialPreviewUrl={initialPreviewUrl}
        initialMessages={game.messages ?? []}
        initialPrompt={prompt}
        initialSession={{
          publicAccessToken: initialToken,
          lastEventId: game.lastEventId ?? undefined,
        }}
      />
    </div>
  )
}

