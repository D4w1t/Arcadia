import { ClerkProvider } from "@clerk/nextjs"
import { shadcn } from "@clerk/ui/themes"
import { Fraunces, Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { Metadata } from "next"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const fontLogo = Fraunces({
  subsets: ["latin"],
  variable: "--font-logo",
})

export const metadata: Metadata = {
  title: {
    default: "Arcadia - Build 3D games with AI",
    template: "%s | Arcadia",
  },
  description: `Arcadia lets you build 3D games using plain English. 
    Type a description, and watch Arcadia plan the scene, write the code, 
    and stream a playable world in seconds.`,
  authors: [{ name: "Dawit Nigussie" }],
  keywords: ["game development", "AI", "three.js", "web3", "Arcadia"],
  category: "game-development",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable,
        fontLogo.variable
      )}
    >
      <body>
        <ClerkProvider appearance={{ theme: shadcn }}>
          <ThemeProvider>{children}</ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
