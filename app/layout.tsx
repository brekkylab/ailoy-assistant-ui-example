"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { Geist, Geist_Mono } from "next/font/google";

import { AiloyAgentProvider } from "@/components/ailoy-agent-provider";
import { AiloyRuntimeProvider } from "@/components/ailoy-runtime-provider";
import { ThreadListSidebar } from "@/components/assistant-ui/threadlist-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThreadProvider } from "@/components/thread-provider";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import "./globals.css";
import { Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ThemeModeToggle = () => {
  const { setTheme } = useTheme();

  // To prevent hydration warning
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="cursor-pointer">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => setTheme("light")}>
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            System
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="description"
          content="Chat UI web application powered by Ailoy"
        />
        <title>Ailoy Web UI</title>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AiloyAgentProvider>
            <ThreadProvider>
              <AiloyRuntimeProvider>
                <SidebarProvider>
                  <div className="flex h-dvh w-full pr-0.5">
                    <ThreadListSidebar />
                    <SidebarInset>
                      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                        <SidebarTrigger />
                        <Separator
                          orientation="vertical"
                          className="mr-2 h-4"
                        />
                        <div className="flex w-full justify-end gap-4">
                          <ThemeModeToggle />
                          <Link
                            href="https://github.com/brekkylab/ailoy"
                            target="_blank"
                          >
                            <Button
                              variant="outline"
                              size="icon"
                              className="cursor-pointer"
                            >
                              <Icons.github className="h-[1.5rem] w-[1.5rem] scale-100" />
                            </Button>
                          </Link>
                        </div>
                      </header>
                      <div className="flex-1 overflow-hidden">{children}</div>
                    </SidebarInset>
                  </div>
                </SidebarProvider>
              </AiloyRuntimeProvider>
            </ThreadProvider>
          </AiloyAgentProvider>
        </ThemeProvider>
      </body>
      <GoogleAnalytics gaId="G-YD06F47LN4" />
    </html>
  );
}
