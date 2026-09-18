import path from "node:path"
import { tool } from "ai"
import { z } from "zod"
import { getGameSandbox } from "@/lib/daytona/utils"

const GAME_ROOT = "/home/daytona/game"

/**
 * Ensures that a given file path resolves strictly within the game directory
 * (/home/daytona/game) to prevent directory traversal and accidental sandbox file escapes.
 */
function resolveGamePath(targetPath: string): string {
  let cleaned = targetPath.trim()

  // Remove any explicit /home/daytona/game prefix if provided by the model
  if (cleaned.startsWith(GAME_ROOT)) {
    cleaned = cleaned.slice(GAME_ROOT.length)
  }

  // Strip leading slashes
  cleaned = cleaned.replace(/^\/+/, "")

  // Normalize path using posix separators
  const normalized = path.posix.normalize(cleaned)

  // Prevent path traversal outside /home/daytona/game
  if (normalized.startsWith("..") || normalized.includes("/../")) {
    throw new Error(
      `Access denied: Path "${targetPath}" resolves outside the sandbox game directory.`
    )
  }

  return path.posix.join(GAME_ROOT, normalized)
}

/**
 * Creates the set of game development tools scoped to a specific game's Daytona sandbox.
 */
export function createGameTools(gameId: string) {
  return {
    write_file: tool({
      description:
        "Create a new file or completely overwrite an existing file inside the game directory (/home/daytona/game). Use this to create or update index.html, scripts, stylesheets, or game assets.",
      inputSchema: z.object({
        path: z
          .string()
          .describe(
            "Relative path to the file inside the game directory (e.g. 'index.html', 'game.js', 'style.css')"
          ),
        content: z
          .string()
          .describe("The full text content to write to the file"),
      }),
      execute: async ({ path: filePath, content }) => {
        try {
          const fullPath = resolveGamePath(filePath)
          const { sandbox } = await getGameSandbox(gameId)

          // Ensure parent directory exists if nested
          const dir = path.posix.dirname(fullPath)
          if (dir !== GAME_ROOT) {
            await sandbox.fs.createFolder(dir, "755").catch(() => {})
          }

          await sandbox.fs.uploadFile(
            Buffer.from(content, "utf-8"),
            fullPath
          )

          return {
            success: true,
            path: filePath,
            message: `Successfully wrote ${content.length} characters to ${filePath}`,
          }
        } catch (error: any) {
          return {
            success: false,
            path: filePath,
            error: error?.message ?? "Failed to write file",
          }
        }
      },
    }),

    replace_text: tool({
      description:
        "Replace an exact target block of text inside an existing file in the game directory. Use this for precise, non-destructive updates without overwriting the entire file.",
      inputSchema: z.object({
        path: z
          .string()
          .describe(
            "Relative path to the file inside the game directory (e.g. 'index.html')"
          ),
        old_text: z
          .string()
          .describe("The exact existing string or block of code to replace"),
        new_text: z
          .string()
          .describe("The new string or block of code to insert in its place"),
      }),
      execute: async ({ path: filePath, old_text, new_text }) => {
        try {
          const fullPath = resolveGamePath(filePath)
          const { sandbox } = await getGameSandbox(gameId)

          const buffer = await sandbox.fs.downloadFile(fullPath)
          const content = buffer.toString("utf-8")

          if (!content.includes(old_text)) {
            return {
              success: false,
              path: filePath,
              error: `Target old_text was not found in ${filePath}. Please inspect the file with read_file first.`,
            }
          }

          const updated = content.replace(old_text, new_text)
          await sandbox.fs.uploadFile(
            Buffer.from(updated, "utf-8"),
            fullPath
          )

          return {
            success: true,
            path: filePath,
            message: `Successfully replaced target text in ${filePath}`,
          }
        } catch (error: any) {
          return {
            success: false,
            path: filePath,
            error: error?.message ?? "Failed to replace text in file",
          }
        }
      },
    }),

    read_file: tool({
      description:
        "Read the text content of a file from the game directory (/home/daytona/game). Always inspect existing files (such as index.html) before modifying them.",
      inputSchema: z.object({
        path: z
          .string()
          .describe(
            "Relative path to the file inside the game directory (e.g. 'index.html', 'game.js')"
          ),
      }),
      execute: async ({ path: filePath }) => {
        try {
          const fullPath = resolveGamePath(filePath)
          const { sandbox } = await getGameSandbox(gameId)

          const buffer = await sandbox.fs.downloadFile(fullPath)
          const content = buffer.toString("utf-8")

          return {
            success: true,
            path: filePath,
            content,
          }
        } catch (error: any) {
          return {
            success: false,
            path: filePath,
            error: error?.message ?? `Failed to read file ${filePath}`,
          }
        }
      },
    }),

    list_files: tool({
      description:
        "List files and directories inside the game directory (/home/daytona/game).",
      inputSchema: z.object({
        path: z
          .string()
          .optional()
          .describe(
            "Optional relative subdirectory path inside the game directory to list (defaults to the root of the game directory)"
          ),
      }),
      execute: async ({ path: subDir }) => {
        try {
          const fullPath = subDir ? resolveGamePath(subDir) : GAME_ROOT
          const { sandbox } = await getGameSandbox(gameId)

          const items = await sandbox.fs.listFiles(fullPath)
          const entries = (items ?? []).map((item) => ({
            name: item.name,
            is_dir: item.isDir,
            size: item.size,
          }))

          return {
            success: true,
            path: subDir ?? "",
            files: entries,
          }
        } catch (error: any) {
          return {
            success: false,
            path: subDir ?? "",
            error: error?.message ?? "Failed to list files",
          }
        }
      },
    }),

    delete_file: tool({
      description:
        "Delete a file or folder from the game directory (/home/daytona/game).",
      inputSchema: z.object({
        path: z
          .string()
          .describe(
            "Relative path to the file or folder to delete (cannot be the root game folder itself)"
          ),
        recursive: z
          .boolean()
          .optional()
          .describe("Set to true if deleting a non-empty directory"),
      }),
      execute: async ({ path: filePath, recursive }) => {
        try {
          const fullPath = resolveGamePath(filePath)

          if (fullPath === GAME_ROOT) {
            return {
              success: false,
              path: filePath,
              error: "Cannot delete the root game directory.",
            }
          }

          const { sandbox } = await getGameSandbox(gameId)
          await sandbox.fs.deleteFile(fullPath, recursive ?? true)

          return {
            success: true,
            path: filePath,
            message: `Successfully deleted ${filePath}`,
          }
        } catch (error: any) {
          return {
            success: false,
            path: filePath,
            error: error?.message ?? `Failed to delete ${filePath}`,
          }
        }
      },
    }),
  }
}

export type GameTools = ReturnType<typeof createGameTools>
