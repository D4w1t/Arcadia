import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { and, eq } from "drizzle-orm"
import { getGameSandbox, startGameServer } from "@/lib/daytona/utils"
import { db } from "@/lib/db"
import { games } from "@/lib/db/schema"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id: gameId } = await params

    // Fetch the game, checking orgId if present
    const [game] = await db
      .select()
      .from(games)
      .where(
        orgId
          ? and(eq(games.id, gameId), eq(games.orgId, orgId))
          : eq(games.id, gameId)
      )
      .limit(1)

    if (!game) {
      return new NextResponse("Game not found", { status: 404 })
    }

    const { getGamePreviewUrl } = await import("@/app/actions/preview")
    const { url } = await getGamePreviewUrl(gameId)
    return NextResponse.json({ url })
  } catch (err: any) {
    console.error("[PREVIEW_ROUTE] Error:", err)
    return new NextResponse(
      `Server error: ${err?.message ?? "Failed to load game preview"}`,
      { status: 500 }
    )
  }
}
