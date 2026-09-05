import { notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { getGame } from "@/lib/games/queries"
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

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col px-4 md:px-6">
      <div className="mx-auto flex h-full w-full max-w-3xl flex-col">
        <ChatThread
          gameId={game.id}
          initialMessages={game.messages ?? []}
          initialPrompt={prompt}
        />
      </div>
    </div>
  )
}
