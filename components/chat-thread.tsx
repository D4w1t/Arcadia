"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import { useChat } from "@ai-sdk/react"
import {
  type UIMessage,
  type UIMessageChunk,
  type ToolUIPart,
  type DynamicToolUIPart,
  isToolUIPart,
  getToolName,
} from "ai"
import {
  CheckIcon,
  ChevronDownIcon,
  Loader2Icon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTriggerChatTransport } from "@trigger.dev/sdk/chat/react"
import type { gameChat } from "@/trigger/chat"
import { getChatSession, mintChatAccessToken, startChatSession } from "@/app/actions/chat"
import { cn } from "cn"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"
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

type ToolCallState = "active" | "done" | "failed"

function getToolCallState(
  part: ToolUIPart<any> | DynamicToolUIPart
): ToolCallState {
  if (part.state === "output-error" || part.state === "output-denied") {
    return "failed"
  }
  if (part.state === "output-available") {
    return "done"
  }
  return "active"
}

function ToolCallMarker({
  part,
}: {
  part: ToolUIPart<any> | DynamicToolUIPart
}) {
  const [isOpen, setIsOpen] = useState(false)
  const state = getToolCallState(part)
  const toolName = getToolName(part)
  const input = part.input as Record<string, unknown> | undefined
  const path =
    input && typeof input === "object" && "path" in input
      ? String(input.path)
      : undefined

  const output = "output" in part ? (part as any).output : undefined
  const errorText = "errorText" in part ? (part as any).errorText : undefined

  const hasDetails = Boolean(
    errorText ||
      (output &&
        (typeof output === "string" ||
          (typeof output === "object" && Object.keys(output).length > 0))) ||
      (input && typeof input === "object" && Object.keys(input).length > 0)
  )

  return (
    <div className="w-full max-w-full rounded-md border border-border/40 bg-muted/20 px-2.5 py-1.5 transition-colors hover:bg-muted/30">
      <Marker
        className="cursor-pointer select-none text-xs font-mono"
        onClick={() => hasDetails && setIsOpen((prev) => !prev)}
      >
        <MarkerIcon>
          {state === "active" && (
            <Loader2Icon className="size-3.5 animate-spin text-amber-500" />
          )}
          {state === "done" && (
            <CheckIcon className="size-3.5 text-emerald-500" />
          )}
          {state === "failed" && (
            <TriangleAlertIcon className="size-3.5 text-destructive" />
          )}
        </MarkerIcon>
        <MarkerContent className="flex flex-1 items-center justify-between gap-2 overflow-hidden">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-semibold text-foreground">{toolName}</span>
            {path && (
              <span className="truncate rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                {path}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={cn("text-[11px] capitalize", {
                "text-amber-500 font-medium": state === "active",
                "text-emerald-500": state === "done",
                "text-destructive font-medium": state === "failed",
              })}
            >
              {state}
            </span>
            {hasDetails && (
              <ChevronDownIcon
                className={cn(
                  "size-3 text-muted-foreground/70 transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            )}
          </div>
        </MarkerContent>
      </Marker>

      {isOpen && (
        <div className="mt-2 space-y-1.5 border-t border-border/40 pt-2 font-mono text-[11px]">
          {errorText && (
            <div className="rounded bg-destructive/10 p-2 text-destructive">
              <span className="font-semibold">Error:</span> {errorText}
            </div>
          )}
          {output && (
            <div className="max-h-40 overflow-auto rounded bg-background/80 p-2 text-muted-foreground">
              {typeof output === "object" && "message" in output ? (
                <div>{String(output.message)}</div>
              ) : (
                <pre className="whitespace-pre-wrap">
                  {typeof output === "string"
                    ? output
                    : JSON.stringify(output, null, 2)}
                </pre>
              )}
            </div>
          )}
          {!output && !errorText && input && (
            <div className="max-h-40 overflow-auto rounded bg-background/80 p-2 text-muted-foreground">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(input, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
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
  onTurnFinish?: () => void
}

export function ChatThread({
  gameId,
  initialMessages = [],
  initialPrompt,
  initialSession,
  onTurnFinish,
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
    onFinish: () => {
      onTurnFinish?.()
    },
    onData: (part) => {
      if (
        part.type === "data-turn-complete" ||
        (part as any).type?.includes("turn-complete")
      ) {
        onTurnFinish?.()
      }
    },
  })

  const prevStatusRef = useRef(status)
  useEffect(() => {
    if (
      (prevStatusRef.current === "streaming" ||
        prevStatusRef.current === "submitted") &&
      status === "ready"
    ) {
      onTurnFinish?.()
    }
    prevStatusRef.current = status
  }, [status, onTurnFinish])

  useEffect(() => {
    const hasAssistantResponse = messages.some(
      (m) =>
        m.role === "assistant" &&
        m.parts?.some(
          (p) =>
            isToolUIPart(p) || (p.type === "text" && p.text.trim().length > 0)
        )
    )
    if (hasAssistantResponse && status === "ready") {
      onTurnFinish?.()
    }
  }, [messages, status, onTurnFinish])

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
                        {isUser ? (
                          <Bubble variant="secondary" align="end">
                            <BubbleContent className="whitespace-pre-wrap">
                              {textContent}
                            </BubbleContent>
                          </Bubble>
                        ) : (
                          <>
                            {message.parts && message.parts.length > 0 ? (
                              <>
                                {message.parts
                                  .filter(
                                    (part) =>
                                      isToolUIPart(part) ||
                                      (part.type === "text" &&
                                        part.text.length > 0)
                                  )
                                  .map((part, partIndex) => {
                                    if (isToolUIPart(part)) {
                                      return (
                                        <ToolCallMarker
                                          key={
                                            part.toolCallId ||
                                            `tool-${partIndex}`
                                          }
                                          part={part}
                                        />
                                      )
                                    }

                                    if (part.type === "text") {
                                      return (
                                        <Bubble
                                          key={`text-${partIndex}`}
                                          variant="ghost"
                                          align="start"
                                        >
                                          <BubbleContent className="whitespace-pre-wrap">
                                            {part.text}
                                          </BubbleContent>
                                        </Bubble>
                                      )
                                    }

                                    return null
                                  })}

                                {!message.parts.some(
                                  (p) =>
                                    isToolUIPart(p) ||
                                    (p.type === "text" && p.text.length > 0)
                                ) && (
                                  <Bubble variant="ghost" align="start">
                                    <BubbleContent className="whitespace-pre-wrap">
                                      <span className="animate-pulse text-xs text-muted-foreground">
                                        Thinking...
                                      </span>
                                    </BubbleContent>
                                  </Bubble>
                                )}
                              </>
                            ) : (
                              <Bubble variant="ghost" align="start">
                                <BubbleContent className="whitespace-pre-wrap">
                                  {textContent || (
                                    <span className="animate-pulse text-xs text-muted-foreground">
                                      Thinking...
                                    </span>
                                  )}
                                </BubbleContent>
                              </Bubble>
                            )}
                          </>
                        )}
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
