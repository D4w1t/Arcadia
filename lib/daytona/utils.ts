import type { Sandbox } from "@daytona/sdk"
import { eq } from "drizzle-orm"
import { daytona } from "@/lib/daytona/client"
import { db } from "@/lib/db"
import { games } from "@/lib/db/schema"

/**
 * Retrieves a guaranteed Daytona sandbox instance for a game.
 * If the game already has a valid sandbox, returns it.
 * If no sandbox exists yet or the previous sandbox is invalid/expired,
 * creates and initializes a new sandbox for the game.
 */
export async function getGameSandbox(
  gameId: string
): Promise<{ sandbox: Sandbox }> {
  const [game] = await db
    .select({ sandboxId: games.sandboxId })
    .from(games)
    .where(eq(games.id, gameId))
    .limit(1)

  if (game?.sandboxId) {
    try {
      const sandbox = await daytona.get(game.sandboxId)
      await sandbox.start().catch(() => {})
      return { sandbox }
    } catch {
      // Sandbox might have been removed or expired remotely; create a new one
    }
  }

  return await createGameSandbox(gameId)
}

/**
 * Creates a Daytona sandbox for a game, seeds /home/daytona/game/index.html
 * with "New game", and stores the sandboxId on the game record in the database.
 * Returns { sandbox } format.
 */
export async function createGameSandbox(
  gameId: string
): Promise<{ sandbox: Sandbox }> {
  // If the game already has an existing sandbox, attempt to reuse it
  const [existingGame] = await db
    .select({ sandboxId: games.sandboxId })
    .from(games)
    .where(eq(games.id, gameId))
    .limit(1)

  if (existingGame?.sandboxId) {
    try {
      const existing = await daytona.get(existingGame.sandboxId)
      await existing.start().catch(() => {})
      await startGameServer(existing)
      return { sandbox: existing }
    } catch {
      // Sandbox might have been removed or expired remotely; create a new one
    }
  }

  const sandbox = await daytona.create()

  await sandbox.fs.createFolder("/home/daytona/game", "755").catch(() => {})
  await sandbox.fs.uploadFile(
    Buffer.from("New game"),
    "/home/daytona/game/index.html"
  )

  await db
    .update(games)
    .set({ sandboxId: sandbox.id })
    .where(eq(games.id, gameId))

  await startGameServer(sandbox)

  return { sandbox }
}

/**
 * Starts an HTTP server in the Daytona sandbox to serve index.html from /home/daytona/game.
 * First checks if a server is already healthy and running on port 3000 to avoid duplicate instances.
 * Returns { sandbox } format.
 */
export async function startGameServer(
  sandboxOrId: Sandbox | string
): Promise<{ sandbox: Sandbox }> {
  const sandbox =
    typeof sandboxOrId === "string" ? await daytona.get(sandboxOrId) : sandboxOrId

  // Health-check: check if port 3000 is already responding with HTTP 200
  try {
    const health = await sandbox.process.executeCommand(
      "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000 || true"
    )
    if (health.result?.trim() === "200") {
      return { sandbox }
    }
  } catch {
    // Health check command failed; proceed to start the server
  }

  // Start HTTP server serving index.html in the background
  await sandbox.process.executeCommand(
    "nohup python3 -m http.server 3000 --directory /home/daytona/game > /home/daytona/server.log 2>&1 &"
  )

  // Verify server is up with a brief polling loop
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    try {
      const check = await sandbox.process.executeCommand(
        "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000 || true"
      )
      if (check.result?.trim() === "200") {
        break
      }
    } catch {
      // Continue polling
    }
  }

  return { sandbox }
}
