import { auth } from "@clerk/nextjs/server"
import { ChatThread } from "@/components/chat-thread"

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await auth.protect()
  await params

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto px-4 md:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <ChatThread />
      </div>
    </div>
  )
}
