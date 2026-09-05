"use client"

import { ArrowUp, ChevronDown, GripHorizontal } from "lucide-react"

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
  )
}
