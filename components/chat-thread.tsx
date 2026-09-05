"use client"

import Image from "next/image"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageGroup,
} from "@/components/ui/message"

export function ChatThread() {
  return (
    <MessageGroup className="gap-6 py-6">
      {/* Turn 1: User */}
      <Message align="end">
        <MessageAvatar>
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">U</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <Bubble variant="secondary" align="end">
            <BubbleContent>
              I want to build a low-poly voxel survival game where the player
              gathers resources and crafts tools.
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>

      {/* Turn 2: Assistant */}
      <Message align="start">
        <MessageAvatar className="bg-transparent">
          <Image
            src="/logo.svg"
            alt="Arcadia"
            width={32}
            height={32}
            className="size-8 rounded-lg"
          />
        </MessageAvatar>
        <MessageContent>
          <Bubble variant="ghost" align="start">
            <BubbleContent className="space-y-2">
              <p>
                I&apos;ve initialized the voxel engine with a procedurally
                generated island. Terrain blocks now support break-and-collect
                events, and your hotbar is mapped to slots 1–5.
              </p>
              <p>What kind of environment should we create first?</p>
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>

      {/* Turn 3: User */}
      <Message align="end">
        <MessageAvatar>
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">U</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <Bubble variant="secondary" align="end">
            <BubbleContent>
              Let&apos;s make a floating island surrounded by purple clouds with
              pine trees and glowing crystal ores.
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>

      {/* Turn 4: Assistant */}
      <Message align="start">
        <MessageAvatar className="bg-transparent">
          <Image
            src="/logo.svg"
            alt="Arcadia"
            width={32}
            height={32}
            className="size-8 rounded-lg"
          />
        </MessageAvatar>
        <MessageContent>
          <Bubble variant="ghost" align="start">
            <BubbleContent className="space-y-2">
              <p>Updated! Here&apos;s what has been added to the world:</p>
              <ul className="list-disc space-y-1 pl-4 text-xs">
                <li>Floating island biome with vertical cliff faces</li>
                <li>Dynamic pine tree instancing with subtle wind sway</li>
                <li>Emissive cyan crystals that drop glowing shards</li>
                <li>Ambient purple cloud layer drifting below the island</li>
              </ul>
              <p>The 3D scene is ready to preview!</p>
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </MessageGroup>
  )
}
