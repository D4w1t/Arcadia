"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { GroupImperativeHandle } from "react-resizable-panels"
import { ChatPreview } from "@/components/chat-preview"
import { ChatThread, type ChatThreadProps } from "@/components/chat-thread"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export interface GameChatProps extends ChatThreadProps {
  sandboxId?: string | null
  initialPreviewUrl?: string | null
}

export function GameChat({
  gameId,
  initialMessages,
  initialPrompt,
  initialSession,
  sandboxId,
  initialPreviewUrl,
}: GameChatProps) {
  const [hasSandbox, setHasSandbox] = useState(Boolean(sandboxId))
  const [revision, setRevision] = useState(0)
  const groupRef = useRef<GroupImperativeHandle>(null)

  useEffect(() => {
    if (sandboxId) {
      setHasSandbox(true)
    }
  }, [sandboxId])

  const handleTurnFinish = useCallback(() => {
    setHasSandbox(true)
    setRevision((prev) => prev + 1)
  }, [])

  useEffect(() => {
    if (hasSandbox && groupRef.current) {
      try {
        groupRef.current.setLayout({
          "chat-panel": 50,
          "preview-panel": 50,
        })
      } catch {
        // Layout handled by panel default sizes
      }
    }
  }, [hasSandbox])

  return (
    <ResizablePanelGroup
      groupRef={groupRef}
      orientation="horizontal"
      className="h-full w-full"
    >
      <ResizablePanel
        id="chat-panel"
        defaultSize={hasSandbox ? 50 : 100}
        minSize={30}
        className="relative flex h-full min-h-0 flex-col overflow-hidden"
      >
        <ChatThread
          gameId={gameId}
          initialMessages={initialMessages}
          initialPrompt={initialPrompt}
          initialSession={initialSession}
          onTurnFinish={handleTurnFinish}
        />
      </ResizablePanel>
      {hasSandbox && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel
            id="preview-panel"
            defaultSize={50}
            minSize={30}
            className="relative flex h-full min-h-0 flex-col overflow-hidden"
          >
            <ChatPreview
              gameId={gameId}
              initialPreviewUrl={initialPreviewUrl}
              revision={revision}
            />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}
