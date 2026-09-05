"use client"

import { useState, useTransition } from "react"
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
import { createGame } from "@/lib/games/actions"

const models = [
  "Kimi K3",
  "Gemini 3 Pro",
  "Claude 3.5 Sonnet",
  "GPT-5",
  "DeepSeek V3",
]

export interface ChatComposerProps {
  value?: string
  onChange?: (value: string) => void
  onSubmit?: (value: string) => void | Promise<void>
  isPending?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  isPending: externalIsPending,
  disabled,
  placeholder = "Describe the game you want to build...",
  className,
}: ChatComposerProps = {}) {
  const [model, setModel] = useState(models[0])
  const [internalPrompt, setInternalPrompt] = useState("")
  const [internalIsPending, startTransition] = useTransition()

  const isControlled = value !== undefined
  const prompt = isControlled ? value : internalPrompt
  const isPending = externalIsPending ?? internalIsPending

  const handlePromptChange = (newVal: string) => {
    if (!isControlled) {
      setInternalPrompt(newVal)
    }
    onChange?.(newVal)
  }

  const handleSubmit = (titleToSubmit?: string) => {
    const title = (titleToSubmit ?? prompt).trim()
    if (!title || isPending || disabled) return

    startTransition(async () => {
      try {
        if (onSubmit) {
          await onSubmit(title)
        } else {
          await createGame(title)
        }
        if (!isControlled) {
          setInternalPrompt("")
        }
      } catch (error) {
        console.error("Failed to submit:", error)
      }
    })
  }

  return (
    <InputGroup className={`bg-popover ${className ?? ""}`}>
      <InputGroupTextarea
        placeholder={placeholder}
        className="field-sizing-content max-h-48 min-h-15"
        rows={1}
        value={prompt}
        onChange={(e) => handlePromptChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
          }
        }}
        disabled={isPending || disabled}
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
          disabled={!prompt.trim() || isPending || disabled}
        >
          <ArrowUp />
        </Button>
      </InputGroupAddon>
    </InputGroup>
  )
}
