"use client";

import { CircleQuestionMark, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { type FC, useEffect, useMemo, useState } from "react";

import {
  type BuiltinTool,
  type MCPServer,
  mcpEventTarget,
  useAiloyAgentContext,
} from "@/components/ailoy-agent-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

const BUILTIN_TOOLS: BuiltinTool[] = [
  {
    id: "web_search_duckduckgo",
    name: "Web Search (DuckDuckGo)",
    description: "Search the web for information",
    icon: "🔍",
  },
  {
    id: "web_fetch",
    name: "Fetch Webpage",
    description: "Fetch the content from webpage url",
    icon: "📄",
  },
];

const BuiltinToolListItem: FC<{ tool: BuiltinTool }> = ({ tool }) => {
  const { selectedBuiltinTools, setSelectedBuiltinTools } =
    useAiloyAgentContext();
  const isSelected = useMemo(() => {
    return selectedBuiltinTools.find((t) => tool.id === t.id) !== undefined;
  }, [selectedBuiltinTools, tool]);

  const handleToggleTool = (tool: BuiltinTool) => {
    if (isSelected) {
      setSelectedBuiltinTools(
        selectedBuiltinTools.filter((t) => t.id !== tool.id),
      );
    } else {
      setSelectedBuiltinTools([...selectedBuiltinTools, tool]);
    }
  };

  return (
    <div
      key={tool.id}
      className="flex items-center gap-4 rounded-lg border p-4"
    >
      <div className="flex flex-1 items-center gap-3">
        <Checkbox
          id={tool.id}
          checked={isSelected}
          onCheckedChange={() => handleToggleTool(tool)}
        />
        <div className="text-3xl">{tool.icon}</div>
        <div>
          <Label
            htmlFor={tool.id}
            className="cursor-pointer font-medium text-primary"
          >
            {tool.name}
          </Label>
          <p className="text-sm text-muted-foreground">{tool.description}</p>
        </div>
      </div>
    </div>
  );
};

const MCPServerListItem: FC<{ server: MCPServer }> = ({ server }) => {
  const {
    addMCPTool,
    removeMCPTool,
    mcpTools,
    selectedMCPTools,
    removeMCPServer,
  } = useAiloyAgentContext();

  const tools = useMemo(() => {
    return mcpTools[server.url] ?? [];
  }, [mcpTools, server]);

  const selectedMCPToolsForServer = useMemo(() => {
    return selectedMCPTools[server.url] ?? [];
  }, [server, selectedMCPTools]);

  const handleMCPToolToggle = (checked: boolean, toolName: string) => {
    if (checked) {
      addMCPTool(server.url, toolName);
    } else {
      removeMCPTool(server.url, toolName);
    }
  };

  const handleRemoveServer = () => {
    removeMCPServer(server.url);
  };

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-xs break-all text-muted-foreground">{server.url}</p>
        <Button
          size="sm"
          variant="destructive"
          className="gap-2 cursor-pointer"
          onClick={handleRemoveServer}
        >
          <Trash2 size={16} />
          <span className="hidden sm:inline">Remove</span>
        </Button>
      </div>

      {/* MCP server tools */}
      <div className="mt-4 space-y-3">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className="flex items-center gap-4 rounded-lg border p-3"
          >
            <Checkbox
              id={tool.name}
              checked={selectedMCPToolsForServer.includes(tool.name)}
              onCheckedChange={(checked) =>
                handleMCPToolToggle(checked as boolean, tool.name)
              }
            />
            <div className="flex-1 min-w-0">
              <Label
                htmlFor={tool.name}
                className="cursor-pointer font-medium text-primary truncate"
              >
                {tool.name}
              </Label>
              <p className="text-sm text-muted-foreground truncate">
                {tool.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MCPServerAddDialog: FC = () => {
  const [mcpDialogOpened, setMcpDialogOpened] = useState<boolean>(false);
  const [mcpUrlInput, setMcpUrlInput] = useState<string>("");
  const [isMCPAdding, setIsMCPAdding] = useState<boolean>(false);

  const { addMCPServer } = useAiloyAgentContext();

  // biome-ignore lint/correctness/useExhaustiveDependencies: false-positive
  useEffect(() => {
    mcpEventTarget.addEventListener(
      "mcp-server-registered",
      onMCPServerRegistered,
    );
    return () => {
      mcpEventTarget.removeEventListener(
        "mcp-server-registered",
        onMCPServerRegistered,
      );
    };
  }, []);

  const handleAddMcpServer = async () => {
    addMCPServer(mcpUrlInput);
    setIsMCPAdding(true);
  };

  const onMCPServerRegistered = () => {
    setIsMCPAdding(false);
    setMcpDialogOpened(false);
  };

  return (
    <Dialog
      open={mcpDialogOpened || isMCPAdding}
      onOpenChange={setMcpDialogOpened}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 cursor-pointer">
          <Plus size={16} />
          <span className="hidden sm:inline">Add MCP Server</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-left">Add MCP Server</DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2 text-left text-muted-foreground text-sm">
            <p>
              Enter the URL of the MCP server supporting streamable HTTP
              transport.
            </p>
            <p>
              Make sure the server is configured to allow Cross-Origin Resource
              Sharing (CORS).
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mcp-url">Server URL</Label>
            <Input
              id="mcp-url"
              type="url"
              placeholder="https://example.com/mcp"
              value={mcpUrlInput}
              onChange={(e) => setMcpUrlInput(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              className="cursor-pointer"
              variant="outline"
              onClick={() => {
                setMcpDialogOpened(false);
                setMcpUrlInput("");
              }}
              disabled={isMCPAdding}
            >
              Cancel
            </Button>
            <Button
              className="cursor-pointer"
              onClick={handleAddMcpServer}
              disabled={isMCPAdding}
            >
              {isMCPAdding ? <Spinner /> : "Add"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MCPHelpDialog: FC = () => {
  return (
    <Dialog>
      <DialogTrigger>
        <CircleQuestionMark className="text-gray-400 cursor-pointer" />
      </DialogTrigger>
      <DialogContent className="w-full sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-left">Using MCP Tools</DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <div className="text-left space-y-2 text-muted-foreground text-sm">
          <p>
            You can register MCP tools with your agent by adding MCP servers
            that support{" "}
            <a
              href="https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#streamable-http"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="underline">Streamable HTTP Transports</span>
            </a>
            .
          </p>
          <p>
            One of the simplest ways to quickly test MCP tools is to use{" "}
            <a
              href="https://smithery.ai"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="underline font-semibold">Smithery</span>
            </a>
            .
          </p>
          <p>
            Copy the MCP server URL by clicking the link below on the Smithery
            page, and use the link to add the MCP server.
          </p>
          <Image
            src="/img/mcp-smithery.png"
            alt="mcp-smithery"
            width={0}
            height={0}
            sizes="100vw"
            style={{ width: "100%", height: "auto" }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function ToolsPage() {
  const { mcpServers } = useAiloyAgentContext();

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold text-primary">Tools</h1>

        {/* Built-in Tools Section */}
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-medium text-primary">
            Built-in Tools
          </h3>
          <div className="space-y-4">
            {BUILTIN_TOOLS.map((tool) => (
              <BuiltinToolListItem key={tool.id} tool={tool} />
            ))}
          </div>
        </div>

        {/* MCP Section */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-2">
            <h3 className="text-lg font-medium text-primary">MCP Servers</h3>
            <MCPHelpDialog />
          </div>
          <MCPServerAddDialog />
        </div>

        <div className="space-y-6">
          {Array.from(mcpServers.entries()).map(([id, server]) => (
            <MCPServerListItem key={id} server={server} />
          ))}
        </div>
      </div>
    </div>
  );
}
