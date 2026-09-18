"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import { getGamePreviewUrl } from "@/app/actions/preview"
import { Button } from "@/components/ui/button"

export interface ChatPreviewProps {
  gameId?: string
  initialPreviewUrl?: string | null
  revision?: number
}

export function ChatPreview({
  gameId,
  initialPreviewUrl,
  revision = 0,
}: ChatPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl ?? null)
  const [isLoading, setIsLoading] = useState(!initialPreviewUrl)
  const [error, setError] = useState<string | null>(null)
  const [internalRevision, setInternalRevision] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const currentRevision = revision + internalRevision

  const fetchPreview = useCallback(async () => {
    if (!gameId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getGamePreviewUrl(gameId)
      if (data.url) {
        setPreviewUrl(data.url)
      } else {
        throw new Error("No preview URL returned")
      }
    } catch (err: any) {
      setError(err?.message ?? "Error loading preview")
    } finally {
      setIsLoading(false)
    }
  }, [gameId])

  useEffect(() => {
    if (!initialPreviewUrl) {
      fetchPreview()
    }
  }, [fetchPreview, initialPreviewUrl])

  useEffect(() => {
    if (revision > 0 && !previewUrl) {
      fetchPreview()
    }
  }, [revision, previewUrl, fetchPreview])

  const handleRefreshIframe = () => {
    setInternalRevision((prev) => prev + 1)
    if (!previewUrl) {
      fetchPreview()
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Connecting to game sandbox...</p>
      </div>
    )
  }

  if (error || !previewUrl) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center">
        <p className="text-sm text-destructive">{error ?? "No preview available"}</p>
        <Button variant="outline" size="sm" onClick={() => fetchPreview()}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background">
      <div className="flex h-9 items-center justify-between border-b bg-muted/30 px-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Preview</span>
          {currentRevision > 0 && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              rev {currentRevision}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleRefreshIframe}
          title="Reload preview"
        >
          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>
      <div className="relative flex-1">
        <iframe
          key={`game-preview-${currentRevision}`}
          ref={iframeRef}
          src={previewUrl}
          className="h-full w-full border-0"
          title="Game Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  )
}
