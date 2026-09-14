import { notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { getGame } from "@/lib/games/queries"
import { mintChatAccessToken } from "@/app/actions/chat"
import { ChatThread } from "@/components/chat-thread"

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

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <ChatThread
        gameId={game.id}
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

