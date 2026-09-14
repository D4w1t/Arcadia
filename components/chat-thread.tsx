"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import { useChat } from "@ai-sdk/react"
import { type UIMessage, type UIMessageChunk } from "ai"
import { useTriggerChatTransport } from "@trigger.dev/sdk/chat/react"
import type { gameChat } from "@/trigger/chat"
import { getChatSession, mintChatAccessToken, startChatSession } from "@/app/actions/chat"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageGroup,
} from "@/components/ui/message"
import { ChatComposer } from "@/components/chat-composer"

function sanitizeUIMessageStream(
  stream: ReadableStream<UIMessageChunk>,
  existingAssistantIds?: Set<string>
): ReadableStream<UIMessageChunk> {
  const activeTextParts = new Set<string>()
  const activeReasoningParts = new Set<string>()
  let ignoringOldTurn = false
  let seenNewTurnStart = !existingAssistantIds || existingAssistantIds.size === 0

  return stream.pipeThrough(
    new TransformStream<UIMessageChunk, UIMessageChunk>({
      transform(chunk, controller) {
        if (!chunk || typeof chunk !== "object") {
          return
        }

        if (chunk.type === "start") {
          const messageId = (chunk as { messageId?: string }).messageId
          if (messageId && existingAssistantIds?.has(messageId)) {
            // This start chunk belongs to an already-rendered assistant message — ignore its replay
            ignoringOldTurn = true
            return
          }
          ignoringOldTurn = false
          seenNewTurnStart = true
          controller.enqueue(chunk)
          return
        }

        if (ignoringOldTurn || !seenNewTurnStart) {
          // Drop all chunks belonging to an old turn or orphan chunks before the new turn starts
          return
        }

        switch (chunk.type) {
          case "text-start":
            activeTextParts.add(chunk.id)
            controller.enqueue(chunk)
            break
          case "text-delta":
            if (activeTextParts.has(chunk.id)) {
              controller.enqueue(chunk)
            }
            break
          case "text-end":
            if (activeTextParts.has(chunk.id)) {
              activeTextParts.delete(chunk.id)
              controller.enqueue(chunk)
            }
            break
          case "reasoning-start":
            activeReasoningParts.add(chunk.id)
            controller.enqueue(chunk)
            break
          case "reasoning-delta":
            if (activeReasoningParts.has(chunk.id)) {
              controller.enqueue(chunk)
            }
            break
          case "reasoning-end":
            if (activeReasoningParts.has(chunk.id)) {
              activeReasoningParts.delete(chunk.id)
              controller.enqueue(chunk)
            }
            break
          default:
            controller.enqueue(chunk)
            break
        }
      },
    })
  )
}

export interface ChatThreadProps {
  gameId?: string
  initialMessages?: UIMessage[]
  initialPrompt?: string
  initialSession?: {
    publicAccessToken?: string
    lastEventId?: string
  }
}

export function ChatThread({
  gameId,
  initialMessages = [],
  initialPrompt,
  initialSession,
}: ChatThreadProps = {}) {
  const { user } = useUser()
  const [input, setInput] = useState("")
  const [wasStopped, setWasStopped] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const isAutoScrollEnabledRef = useRef(true)
  const initialPromptSubmittedRef = useRef(false)

  const sanitizedInitialMessages = useMemo(() => {
    return initialMessages.map((m) => ({
      ...m,
      id: m.id && m.id.trim() !== "" ? m.id : crypto.randomUUID(),
    }))
  }, [initialMessages])

  const rawTransport = useTriggerChatTransport<typeof gameChat>({
    task: "game-chat",
    accessToken: ({ chatId }) => mintChatAccessToken(chatId),
    startSession: ({ chatId, clientData }) =>
      startChatSession({ chatId, clientData }),
    sessions:
      gameId && initialSession?.publicAccessToken
        ? {
            [gameId]: {
              publicAccessToken: initialSession.publicAccessToken,
              lastEventId: initialSession.lastEventId,
            },
          }
        : undefined,
  })

  const transport = useMemo(() => {
    return new Proxy(rawTransport, {
      get(target, prop, receiver) {
        if (prop === "sendMessages") {
          return async (
            options: Parameters<typeof rawTransport.sendMessages>[0]
          ) => {
            if (gameId) {
              try {
                const session = await getChatSession(gameId)
                if (session.lastEventId) {
                  const token = await mintChatAccessToken(gameId)
                  target.setSession(gameId, {
                    publicAccessToken: token,
                    lastEventId: session.lastEventId,
                    isStreaming: false,
                  })
                }
              } catch (e) {
                console.error("Failed to sync session cursor before send:", e)
              }
            }

            const existingAssistantIds = new Set(
              options.messages
                .filter((m) => m.role === "assistant" && m.id)
                .map((m) => m.id)
            )

            const stream = await target.sendMessages(options)
            return sanitizeUIMessageStream(stream, existingAssistantIds)
          }
        }
        if (prop === "reconnectToStream") {
          return async (
            options: Parameters<typeof rawTransport.reconnectToStream>[0]
          ) => {
            const stream = await target.reconnectToStream(options)
            return stream ? sanitizeUIMessageStream(stream) : null
          }
        }
        const val = Reflect.get(target, prop, receiver)
        return typeof val === "function" ? val.bind(target) : val
      },
    })
  }, [rawTransport, gameId])

  const { messages, sendMessage, stop, status, error } = useChat({
    id: gameId,
    messages: sanitizedInitialMessages,
    transport,
    resume: sanitizedInitialMessages.length > 0,
  })

  const isPending = status === "submitted" || status === "streaming"

  const handleStop = async () => {
    stop()
    setWasStopped(true)
    if (gameId) {
      await rawTransport.stopGeneration(gameId).catch(() => {})
    }
  }

  const handleScroll = () => {
    const container = messagesContainerRef.current
    if (!container) return
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100
    isAutoScrollEnabledRef.current = isNearBottom
  }

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container || !isAutoScrollEnabledRef.current) return

    container.scrollTop = container.scrollHeight
  }, [messages, status])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [])

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
    setWasStopped(false)
    setInput("")
    isAutoScrollEnabledRef.current = true
    const container = messagesContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
    await sendMessage({ text })
  }

  const handleContinue = async () => {
    await handleSubmit("continue")
  }

  const canContinue = wasStopped && !isPending

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto"
      >
        <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-between px-4 pb-36 pt-6 md:px-6">
          {messages.length === 0 ? (
            <div className="flex h-full min-h-[300px] flex-1 flex-col items-center justify-center text-center text-muted-foreground">
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
            <MessageGroup className="gap-6">
              {messages
                .filter((message, index, self) => {
                  if (!message.id) return true
                  return self.findLastIndex((m) => m.id === message.id) === index
                })
                .map((message, index) => {
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
            </MessageGroup>
          )}

          {error && (
            <div className="my-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
              {error.message || "An error occurred while sending the message."}
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background via-background/90 to-transparent pb-4 pt-10">
        <div className="pointer-events-auto mx-auto max-w-3xl px-4 md:px-6">
          <ChatComposer
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            onStop={handleStop}
            onContinue={handleContinue}
            canContinue={canContinue}
            isPending={isPending}
            placeholder="Ask a question or describe changes..."
          />
        </div>
      </div>
    </div>
  )
}
