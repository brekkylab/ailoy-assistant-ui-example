"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThreadListSidebar } from "@/components/assistant-ui/threadlist-sidebar";
import { Separator } from "@/components/ui/separator";

import { AiloyRuntimeProvider } from "@/components/ailoy-runtime-provider";
import { ThreadProvider } from "@/components/thread-provider";
import { AiloyAgentProvider } from "@/components/ailoy-agent-provider";

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
                      {/* <div className="flex w-full justify-between">
                        <ModelSelector />
                        <ReasoningSwitch />
                      </div> */}
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
