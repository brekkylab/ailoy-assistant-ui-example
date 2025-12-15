import { Brain, CircleAlert, Mail, MessageSquare, Wrench } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import * as React from "react";

import { ThreadList } from "@/components/assistant-ui/thread-list";
import { Icons } from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const ContactsButton: React.FC = () => {
  const [isMounted, setIsMounted] = React.useState(false);
  const { theme } = useTheme();

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton size="sm" asChild className="cursor-pointer">
          <div>
            <div className="aui-sidebar-footer-icon-wrapper flex aspect-square size-4 items-center justify-center">
              <img
                src={`/img/brekkylab-logo-${theme === "light" ? "black" : "white"}.png`}
                alt="brekkylab"
              />
            </div>
            <div className="aui-sidebar-footer-heading flex flex-col gap-0.5 leading-none text-muted-foreground">
              <p>Contacts</p>
            </div>
          </div>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <Link href="mailto:contact@brekkylab.com" target="_blank">
            <DropdownMenuItem>
              <Mail className="size-4" />
              Email
            </DropdownMenuItem>
          </Link>
          <Link href="https://discord.gg/27rx3EJy3P" target="_blank">
            <DropdownMenuItem>
              <Icons.discord className="h-[1.5rem] w-[1.5rem] scale-100" />
              Discord
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

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
              <SidebarMenuButton
                size="lg"
                asChild
                onClick={() => handleMenuClicked("/")}
              >
                <div>
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
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarHeader>
      <SidebarContent className="aui-sidebar-content px-2">
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="cursor-pointer"
            onClick={() => handleMenuClicked("/")}
          >
            <MessageSquare />
            <span className="font-bold">Chat</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="cursor-pointer"
            onClick={() => handleMenuClicked("/models")}
          >
            <Brain />
            <span className="font-bold">Models</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
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
            <ContactsButton />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" asChild>
              <Link
                href="https://github.com/brekkylab/ailoy/issues"
                target="_blank"
              >
                <div className="aui-sidebar-footer-icon-wrapper flex aspect-square size-4 items-center justify-center">
                  <CircleAlert className="scale-100" />
                </div>
                <div className="aui-sidebar-footer-heading flex flex-col gap-0.5 leading-none text-muted-foreground">
                  <p>Report an Issue</p>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" asChild>
              <Link href="https://brekkylab.github.io/ailoy" target="_blank">
                <div className="aui-sidebar-footer-icon-wrapper flex aspect-square size-4 items-center justify-center">
                  <img
                    src="https://brekkylab.github.io/ailoy/img/logo.png"
                    alt="ailoy"
                  />
                </div>
                <div className="aui-sidebar-footer-heading flex flex-col gap-0.5 leading-none text-muted-foreground">
                  <p>
                    Powered by{" "}
                    <span className="aui-sidebar-footer-title font-extrabold text-accent-foreground">
                      Ailoy
                    </span>
                  </p>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
