"use client"

import {
  ArrowUp,
  Car,
  ChevronDown,
  Crosshair,
  Gamepad2,
  GripHorizontal,
  Pickaxe,
  Plane,
  Swords,
  Zap,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { useState, useTransition } from "react"
import { createGame } from "@/lib/games/actions"

const models = [
  "Kimi K3",
  "Gemini 3 Pro",
  "Claude 3.5 Sonnet",
  "GPT-5",
  "DeepSeek V3",
]

const suggesstions = [
  {
    label: "Voxel survival",
    icon: <Pickaxe />,
  },
  {
    label: "Ink samurai duel",
    icon: <Swords />,
  },
  {
    label: "Comic-book firefight",
    icon: <Zap />,
  },
  {
    label: "Realistic battlefield",
    icon: <Plane />,
  },
  {
    label: "Fight-first shooter",
    icon: <Crosshair />,
  },
  {
    label: "Jungle expedition drive",
    icon: <Car />,
  },
  {
    label: "Sunny kingdom platformer",
    icon: <Gamepad2 />,
  },
]

export function ChatComposer() {
  const [model, setModel] = useState(models[0])
  const [prompt, setPrompt] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (titleToSubmit?: string) => {
    const title = (titleToSubmit ?? prompt).trim()
    if (!title || isPending) return

    startTransition(async () => {
      try {
        await createGame(title)
        setPrompt("")
      } catch (error) {
        console.error("Failed to create game:", error)
      }
    })
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <InputGroup className="bg-popover">
        <InputGroupTextarea
          placeholder="Describe the game you want to build..."
          className="field-sizing-content max-h-48 min-h-15"
          rows={1}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          disabled={isPending}
        />
        <InputGroupAddon
          align="block-end"
          className="justify-between px-3 pb-2.5"
        >
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                />
              }
            >
              <GripHorizontal />
              <span>{model}</span>
              <ChevronDown />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {models.map((model) => (
                <DropdownMenuItem key={model} onClick={() => setModel(model)}>
                  {model}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="icon-sm"
            className="rounded-full"
            type="button"
            onClick={() => handleSubmit()}
            disabled={!prompt.trim() || isPending}
          >
            <ArrowUp />
          </Button>
        </InputGroupAddon>
      </InputGroup>

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
              onClick={() => handleSubmit(suggestion.label)}
            >
              {suggestion.icon}
              {suggestion.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
