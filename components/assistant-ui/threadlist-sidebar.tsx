import { BookOpenText, Brain, Bug, MessageSquare, Wrench } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type * as React from "react";

import { ThreadList } from "@/components/assistant-ui/thread-list";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

export function ThreadListSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  const handleMenuClicked = (route: string) => {
    setOpenMobile(false);
    router.push(route);
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader className="aui-sidebar-header mb-2 border-b">
        <div className="aui-sidebar-header-content flex items-center justify-between">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/">
                  <Image
                    src="https://brekkylab.github.io/ailoy/img/logo.png"
                    width={32}
                    height={32}
                    alt="logo"
                  />
                  <div className="aui-sidebar-header-heading mr-6 flex flex-col gap-0.5 leading-none">
                    <span className="aui-sidebar-header-title font-semibold">
                      Ailoy Web UI
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarHeader>
      <SidebarContent className="aui-sidebar-content px-2">
        <SidebarMenuItem>
          <SidebarMenuButton
            className="cursor-pointer"
            onClick={() => handleMenuClicked("/")}
          >
            <MessageSquare />
            <span className="font-bold">Chat</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            className="cursor-pointer"
            onClick={() => handleMenuClicked("/models")}
          >
            <Brain />
            <span className="font-bold">Models</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            className="cursor-pointer"
            onClick={() => handleMenuClicked("/tools")}
          >
            <Wrench />
            <span className="font-bold">Tools</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarSeparator className="mx-0" />

        {pathname === "/" && <ThreadList />}
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter className="aui-sidebar-footer border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link
                href="https://github.com/brekkylab/ailoy/issues"
                target="_blank"
              >
                <div className="aui-sidebar-footer-icon-wrapper flex aspect-square size-8 items-center justify-center rounded-lg border border-sidebar-border text-sidebar-foreground">
                  <Bug className="aui-sidebar-footer-icon size-4" />
                </div>
                <div className="aui-sidebar-footer-heading flex flex-col gap-0.5 leading-none text-muted-foreground">
                  <p>Have any troubles?</p>
                  <span>
                    Leave an{" "}
                    <span className="text-accent-foreground font-bold">
                      issue
                    </span>{" "}
                    here
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="https://brekkylab.github.io/ailoy" target="_blank">
                <div className="aui-sidebar-footer-icon-wrapper flex aspect-square size-8 items-center justify-center rounded-lg border border-sidebar-border text-sidebar-foreground">
                  <BookOpenText className="aui-sidebar-footer-icon size-4" />
                </div>
                <div className="aui-sidebar-footer-heading flex flex-col gap-0.5 leading-none text-muted-foreground">
                  <p>
                    Powered by{" "}
                    <span className="aui-sidebar-footer-title font-extrabold text-accent-foreground">
                      Ailoy
                    </span>
                  </p>
                  <span>View Documentation</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
