import type { FC } from "react";
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
} from "@assistant-ui/react";
import {
  PlusIcon,
  Trash2Icon,
  Brain,
  MessageSquare,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { Separator } from "@/components/ui/separator";
import { usePathname, useRouter } from "next/navigation";

export const ThreadList: FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <ThreadListPrimitive.Root className="aui-root aui-thread-list-root flex flex-col items-stretch gap-1.5">
      <Button
        variant="ghost"
        className="flex cursor-pointer items-center justify-start gap-1 rounded-lg px-2.5 py-2 text-start hover:bg-muted data-active:bg-muted"
        onClick={() => router.push("/")}
      >
        <MessageSquare />
        Chat
      </Button>
      <Button
        variant="ghost"
        className="flex cursor-pointer items-center justify-start gap-1 rounded-lg px-2.5 py-2 text-start hover:bg-muted data-active:bg-muted"
        onClick={() => router.push("/models")}
      >
        <Brain />
        Models
      </Button>
      <Button
        variant="ghost"
        className="flex cursor-pointer items-center justify-start gap-1 rounded-lg px-2.5 py-2 text-start hover:bg-muted data-active:bg-muted"
        onClick={() => router.push("/tools")}
      >
        <Wrench />
        Tools
      </Button>

      {pathname === "/" && (
        <>
          <Separator />
          <ThreadListNew />
          <ThreadListItems />
        </>
      )}
    </ThreadListPrimitive.Root>
  );
};

const ThreadListNew: FC = () => {
  return (
    <ThreadListPrimitive.New asChild>
      <Button
        className="aui-thread-list-new flex cursor-pointer items-center justify-start gap-1 rounded-lg px-2.5 py-2 text-start hover:bg-muted data-active:bg-muted"
        variant="ghost"
      >
        <PlusIcon />
        New Thread
      </Button>
    </ThreadListPrimitive.New>
  );
};

const ThreadListItems: FC = () => {
  return <ThreadListPrimitive.Items components={{ ThreadListItem }} />;
};

const ThreadListItem: FC = () => {
  return (
    <ThreadListItemPrimitive.Root className="aui-thread-list-item flex items-center gap-2 rounded-lg transition-all hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-active:bg-muted">
      <ThreadListItemPrimitive.Trigger className="aui-thread-list-item-trigger min-w-0 flex-grow cursor-pointer px-3 py-2 text-start">
        <ThreadListItemTitle />
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemDelete />
    </ThreadListItemPrimitive.Root>
  );
};

const ThreadListItemTitle: FC = () => {
  return (
    <span className="aui-thread-list-item-title block max-w-full truncate text-sm">
      <ThreadListItemPrimitive.Title fallback="New Chat" />
    </span>
  );
};

const ThreadListItemDelete: FC = () => {
  return (
    <ThreadListItemPrimitive.Delete asChild className="cursor-pointer">
      <TooltipIconButton
        className="aui-thread-list-item-archive mr-3 ml-auto size-4 p-0 text-foreground hover:text-primary"
        variant="ghost"
        tooltip="Delete thread"
      >
        <Trash2Icon />
      </TooltipIconButton>
    </ThreadListItemPrimitive.Delete>
  );
};
