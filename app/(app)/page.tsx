import Image from "next/image"
import { auth } from "@clerk/nextjs/server"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { ChatComposer } from "@/components/chat-composer"
import { suggesstions } from "@/lib/game/suggesstions"
import { createGame } from "@/lib/games/actions"

export default async function Page() {
  await auth.protect()

  return (
    <Empty className="min-h-svh">
      <EmptyHeader>
        <EmptyMedia>
          <Image src="/logo.svg" alt="Logo" width={48} height={48} />
        </EmptyMedia>
        <EmptyTitle className="text-2xl">
          What should we build today?
        </EmptyTitle>
        <EmptyDescription>
          Build your own racers, shooters, puzzles and whole worlds using your
          own words. If you can describe it, you can play it.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="max-w-2xl gap-6">
        <ChatComposer />
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {suggesstions.map((suggestion) => (
              <form
                key={suggestion.label}
                action={async () => {
                  "use server"
                  await createGame(suggestion.label)
                }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full font-normal text-muted-foreground hover:text-foreground"
                  type="submit"
                >
                  {suggestion.icon}
                  {suggestion.label}
                </Button>
              </form>
            ))}
          </div>
        </div>
      </EmptyContent>
    </Empty>
  )
}
