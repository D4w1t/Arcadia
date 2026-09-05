"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Coins, MessageSquareIcon, SquarePen } from "lucide-react"
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"
import { Empty, EmptyDescription } from "@/components/ui/empty"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
              <Image
                src="/logo.svg"
                alt="Arcadia"
                width={20}
                height={20}
                className="size-5"
              />
              <span className="font-logo text-base font-semibold">Arcadia</span>
            </div>
            <SidebarTrigger />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/" />}
                  isActive={pathname === "/"}
                  tooltip="New game"
                >
                  <SquarePen />
                  <span>New game</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Recents</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="group-data-[collapsible=icon]:hidden">
              <Empty className="border border-dashed p-2">
                <EmptyDescription className="text-xs">
                  Your games will live here.
                </EmptyDescription>
              </Empty>
            </div>
            <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Recents">
                  <MessageSquareIcon />
                  <span>Recents</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Credits">
              <Coins />
              <span>Credits</span>
            </SidebarMenuButton>
            <SidebarMenuBadge>$1.00</SidebarMenuBadge>
          </SidebarMenuItem>
          <SidebarMenuItem className="flex items-center justify-between px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <OrganizationSwitcher
                appearance={{
                  elements: {
                    rootBox: "w-full! max-w-full",
                    organizationSwitcherTrigger:
                      "w-full! max-w-full justify-between!",
                    organizationPreview: "min-w-0",
                    organizationPreviewTextContainer: "min-w-0",
                    organizationPreviewMainIdentifier: "truncate",
                  },
                }}
              />
            </div>
            <UserButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
