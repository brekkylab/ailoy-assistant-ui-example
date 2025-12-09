"use client";

import { CircleQuestionMark, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { type FC, useEffect, useMemo, useState } from "react";

import {
  type BuiltinTool,
  type MCPClient,
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
      className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
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
            className="cursor-pointer font-medium text-gray-900"
          >
            {tool.name}
          </Label>
          <p className="text-sm text-gray-600">{tool.description}</p>
        </div>
      </div>
    </div>
  );
};

const MCPClientListItem: FC<{ client: MCPClient }> = ({ client }) => {
  const {
    addMCPTool,
    removeMCPTool,
    mcpTools,
    selectedMCPTools,
    removeMCPClient,
  } = useAiloyAgentContext();

  const tools = useMemo(() => {
    return mcpTools[client.url] ?? [];
  }, [mcpTools, client]);

  const selectedMCPToolsForClient = useMemo(() => {
    return selectedMCPTools[client.url] ?? [];
  }, [client, selectedMCPTools]);

  const handleMCPToolToggle = (checked: boolean, toolName: string) => {
    if (checked) {
      addMCPTool(client.url, toolName);
    } else {
      removeMCPTool(client.url, toolName);
    }
  };

  const handleRemoveClient = () => {
    removeMCPClient(client.url);
  };

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs break-all text-gray-600">{client.url}</p>
        </div>
        <Button
          size="sm"
          variant="destructive"
          className="gap-2 cursor-pointer"
          onClick={handleRemoveClient}
        >
          <Trash2 size={16} />
          <span className="hidden sm:inline">Remove</span>
        </Button>
      </div>

      {/* MCP client tools */}
      <div className="mt-4 space-y-3">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className="flex items-center gap-4 rounded-lg border border-gray-200 p-3"
          >
            <Checkbox
              id={tool.name}
              checked={selectedMCPToolsForClient.includes(tool.name)}
              onCheckedChange={(checked) =>
                handleMCPToolToggle(checked as boolean, tool.name)
              }
            />
            <div className="flex-1 min-w-0">
              <Label
                htmlFor={tool.name}
                className="cursor-pointer font-medium text-gray-900 block"
              >
                {tool.name}
              </Label>
              <p className="text-sm text-gray-400 truncate">
                {tool.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MCPClientDialog: FC = () => {
  const [mcpDialogOpened, setMcpDialogOpened] = useState<boolean>(false);
  const [mcpUrlInput, setMcpUrlInput] = useState<string>("");
  const [isMCPAdding, setIsMCPAdding] = useState<boolean>(false);

  const { addMCPClient } = useAiloyAgentContext();

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

  const handleAddMcpClient = async () => {
    addMCPClient(mcpUrlInput);
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
          <span className="hidden sm:inline">Add MCP Client</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add MCP Client</DialogTitle>
          <DialogDescription>
            Enter the URL of the MCP streamable HTTP transport.
            <br />
            Make sure the server is configured to allow Cross-Origin Resource
            Sharing (CORS).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
              onClick={handleAddMcpClient}
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
          <DialogDescription className="text-left">
            You can register MCP tools with your agent by adding MCP clients
            that support{" "}
            <a
              href="https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#streamable-http"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="underline">Streamable HTTP Transports</span>
            </a>
            .
            <br />
            <br />
            One of the simplest ways to quickly test MCP tools is to use{" "}
            <a
              href="https://smithery.ai"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="underline">Smithery</span>
            </a>
            .
            <br />
            Copy the MCP server URL by clicking the link below on the Smithery
            page, and use the link to add the MCP client.
            <Image
              src="/img/mcp-smithery.png"
              alt="mcp-smithery"
              width={0}
              height={0}
              sizes="100vw"
              style={{ width: "100%", height: "auto" }}
            />
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default function ToolsPage() {
  const { mcpClients } = useAiloyAgentContext();

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Tools</h1>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          {/* Built-in Tools Section */}
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-medium text-gray-800">
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
              <h3 className="text-lg font-medium text-gray-800">MCP Clients</h3>
              <MCPHelpDialog />
            </div>
            <MCPClientDialog />
          </div>

          <div className="space-y-6">
            {Array.from(mcpClients.entries()).map(([id, client]) => (
              <MCPClientListItem key={id} client={client} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
