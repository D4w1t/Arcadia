"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChatComposer } from "@/components/chat-composer"
import { suggesstions } from "@/lib/game/suggesstions"
import { createGame } from "@/lib/games/actions"

export function GameComposer() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleCreate = (prompt: string) => {
    const text = prompt.trim()
    if (!text || isPending) return

    startTransition(async () => {
      try {
        const game = await createGame(text)
        if (game?.id) {
          router.push(`/games/${game.id}?prompt=${encodeURIComponent(text)}`)
        }
      } catch (error) {
        console.error("Failed to create game:", error)
      }
    })
  }

  return (
    <>
      <ChatComposer onSubmit={handleCreate} isPending={isPending} />
      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {suggesstions.map((suggestion) => (
            <Button
              key={suggestion.label}
              variant="outline"
              size="sm"
              className="rounded-full font-normal text-muted-foreground hover:text-foreground"
              type="button"
              disabled={isPending}
              onClick={() => handleCreate(suggestion.label)}
            >
              {suggestion.icon}
              {suggestion.label}
            </Button>
          ))}
        </div>
      </div>
    </>
  )
}
