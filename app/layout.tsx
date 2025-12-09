"use client";

import { Geist, Geist_Mono } from "next/font/google";

import { AiloyAgentProvider } from "@/components/ailoy-agent-provider";
import { AiloyRuntimeProvider } from "@/components/ailoy-runtime-provider";
import { ThreadListSidebar } from "@/components/assistant-ui/threadlist-sidebar";
import { ThreadProvider } from "@/components/thread-provider";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
                      <Separator orientation="vertical" className="mr-2 h-4" />
                      <div className="flex w-full justify-end">
                        <a
                          href="https://github.com/brekkylab/ailoy"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {/** biome-ignore lint/performance/noImgElement: github */}
                          <img
                            src="https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg"
                            width={24}
                            height={24}
                            alt="ailoy-github"
                          />
                        </a>
                      </div>
                    </header>
                    <div className="flex-1 overflow-hidden">{children}</div>
                  </SidebarInset>
                </div>
              </SidebarProvider>
            </AiloyRuntimeProvider>
          </ThreadProvider>
        </AiloyAgentProvider>
      </body>
    </html>
  );
}
