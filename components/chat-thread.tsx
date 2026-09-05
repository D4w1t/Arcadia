"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageGroup,
} from "@/components/ui/message"
import { ChatComposer } from "@/components/chat-composer"

export interface ChatThreadProps {
  gameId?: string
  initialMessages?: UIMessage[]
  initialPrompt?: string
}

export function ChatThread({
  gameId,
  initialMessages = [],
  initialPrompt,
}: ChatThreadProps = {}) {
  const { user } = useUser()
  const [input, setInput] = useState("")
  const scrollBottomRef = useRef<HTMLDivElement>(null)
  const initialPromptSubmittedRef = useRef(false)

  const sanitizedInitialMessages = initialMessages.map((m, i) => ({
    ...m,
    id: m.id && m.id.trim() !== "" ? m.id : `msg-${i}`,
  }))

  const { messages, sendMessage, status, error } = useChat({
    id: gameId,
    messages: sanitizedInitialMessages,
    transport: new DefaultChatTransport({
      body: gameId ? { gameId } : undefined,
    }),
  })

  const isPending = status === "submitted" || status === "streaming"

  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, status])

  useEffect(() => {
    if (
      initialPrompt &&
      !initialPromptSubmittedRef.current &&
      messages.length === 0 &&
      status === "ready"
    ) {
      initialPromptSubmittedRef.current = true
      if (typeof window !== "undefined" && gameId) {
        window.history.replaceState(null, "", `/games/${gameId}`)
      }
      sendMessage({ text: initialPrompt })
    }
  }, [initialPrompt, messages.length, status, sendMessage, gameId])

  const handleSubmit = async (value: string) => {
    const text = value.trim()
    if (!text || isPending) return
    setInput("")
    await sendMessage({ text })
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col justify-between gap-6">
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center text-muted-foreground">
            <Image
              src="/logo.svg"
              alt="Arcadia"
              width={40}
              height={40}
              className="mb-3 opacity-60"
            />
            <p className="text-sm font-medium">Ready to build</p>
            <p className="mt-1 text-xs text-muted-foreground/80">
              Describe gameplay, mechanics, or environment changes to update
              your game.
            </p>
          </div>
        ) : (
          <MessageGroup className="gap-6 py-6">
            {messages.map((message, index) => {
              const isUser = message.role === "user"
              const messageKey =
                message.id && message.id.trim() !== ""
                  ? message.id
                  : `msg-${index}-${message.role}`
              const textContent =
                message.parts
                  ?.filter(
                    (part): part is { type: "text"; text: string } =>
                      part.type === "text"
                  )
                  .map((part) => part.text)
                  .join("\n") ||
                (message as unknown as { content?: string }).content ||
                ""

              return (
                <Message key={messageKey} align={isUser ? "end" : "start"}>
                  <MessageAvatar
                    className={!isUser ? "bg-transparent" : undefined}
                  >
                    {isUser ? (
                      <Avatar className="size-8">
                        {user?.imageUrl && (
                          <AvatarImage
                            src={user.imageUrl}
                            alt={user.fullName || "User"}
                          />
                        )}
                        <AvatarFallback className="text-xs">
                          {user?.firstName?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Image
                        src="/logo.svg"
                        alt="Arcadia"
                        width={32}
                        height={32}
                        className="size-8 rounded-lg"
                      />
                    )}
                  </MessageAvatar>
                  <MessageContent>
                    <Bubble
                      variant={isUser ? "secondary" : "ghost"}
                      align={isUser ? "end" : "start"}
                    >
                      <BubbleContent className="whitespace-pre-wrap">
                        {textContent || (
                          <span className="animate-pulse text-xs text-muted-foreground">
                            Thinking...
                          </span>
                        )}
                      </BubbleContent>
                    </Bubble>
                  </MessageContent>
                </Message>
              )
            })}
            <div ref={scrollBottomRef} />
          </MessageGroup>
        )}

        {error && (
          <div className="my-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
            {error.message || "An error occurred while sending the message."}
          </div>
        )}
      </div>

      <div className="pb-4">
        <ChatComposer
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          isPending={isPending}
          placeholder="Ask a question or describe changes..."
        />
      </div>
    </div>
  )
}
