import * as ai from "ailoy-web";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useLocalStorage } from "@/hooks/use-local-storage";
import type {
  AddBuiltinTool,
  AddMCPServer,
  AddMCPTool,
  ClearTools,
  InitializeApiAgent,
  InitializeLocalAgent,
  MCPServerRegistered,
  OutData,
  RemoveMCPServer,
  RemoveTool,
  RunAgent,
} from "@/workers/agent.worker";

export interface AiloyLocalLMConfig {
  type: "local";
  modelName: string;
}

export interface AiloyAPILMConfig {
  type: "api";
  spec: "OpenAI" | "Gemini" | "Claude" | "Grok";
  modelName: string;
}

export type AiloyLMConfig = AiloyLocalLMConfig | AiloyAPILMConfig;

export type APIKeys = Record<AiloyAPILMConfig["spec"], string | undefined>;
const emptyApiKeys = {
  OpenAI: undefined,
  Gemini: undefined,
  Claude: undefined,
  Grok: undefined,
} as const;

export interface BuiltinTool {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface MCPServer {
  url: string;
}

class AgentStreamEventTarget extends EventTarget {}
export const agentStreamEventTarget = new AgentStreamEventTarget();

class MCPEventTarget extends EventTarget {}
export const mcpEventTarget = new MCPEventTarget();

const AiloyAgentContext = createContext<{
  isWebGPUSupported: boolean;
  webgpuLimits: GPUAdapter["limits"] | undefined;
  agentInitialized: boolean;
  isModelLoading: boolean;
  modelLoadingProgress: ai.CacheProgress | undefined;
  downloadedModels: string[];
  setDownloadedModels: (models: string[]) => void;
  selectedModel: AiloyLMConfig | undefined;
  setSelectedModel: (config: AiloyLMConfig | undefined) => void;
  apiKeys: APIKeys;
  setApiKey: (provider: keyof APIKeys, key: string | undefined) => void;
  agentRunConfig: ai.AgentConfig;
  setAgentRunConfig: (config: ai.AgentConfig) => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  selectedBuiltinTools: BuiltinTool[];
  setSelectedBuiltinTools: (tools: BuiltinTool[]) => void;
  mcpServers: MCPServer[];
  addMCPServer: (url: string) => void;
  removeMCPServer: (url: string) => void;
  mcpTools: Record<string, ai.ToolDesc[]>;
  selectedMCPTools: Record<string, string[]>;
  addMCPTool: (url: string, name: string) => void;
  removeMCPTool: (url: string, name: string) => void;
  runAgent: (messages: ai.Message[]) => void;
}>({
  isWebGPUSupported: false,
  webgpuLimits: undefined,
  agentInitialized: false,
  isModelLoading: false,
  modelLoadingProgress: undefined,
  downloadedModels: [],
  setDownloadedModels: () => {},
  selectedModel: undefined,
  setSelectedModel: () => {},
  apiKeys: emptyApiKeys,
  setApiKey: () => {},
  agentRunConfig: {},
  setAgentRunConfig: () => {},
  systemPrompt: "",
  setSystemPrompt: () => {},
  selectedBuiltinTools: [],
  setSelectedBuiltinTools: () => {},
  mcpServers: [],
  addMCPServer: () => {},
  removeMCPServer: () => {},
  mcpTools: {},
  selectedMCPTools: {},
  addMCPTool: () => {},
  removeMCPTool: () => {},
  runAgent: () => {},
});

export function AiloyAgentProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [isWebGPUSupported, setIsWebGPUSupported] = useState<boolean>(false);
  const [webgpuLimits, setWebgpuLimits] = useState<
    GPUAdapter["limits"] | undefined
  >(undefined);
  const [downloadedModels, setDownloadedModels] = useLocalStorage<string[]>(
    "ailoy/downloadedModels",
    [],
  );
  const [selectedModel, setSelectedModel] = useLocalStorage<
    AiloyLMConfig | undefined
  >("ailoy/selectedModel", undefined);
  const [apiKeys, setApiKeys] = useLocalStorage<APIKeys>(
    "ailoy/apiKeys",
    emptyApiKeys,
  );

  const [selectedBuiltinTools, setSelectedBuiltinTools] = useLocalStorage<
    BuiltinTool[]
  >("ailoy/selectedBuiltinTools", []);

  const [mcpServers, setMCPServers] = useLocalStorage<MCPServer[]>(
    "ailoy/mcpServers",
    [],
  );
  const [mcpServersStatus, setMCPServersStatus] = useState<
    Record<string, "initializing" | "initialized">
  >({});
  const [mcpTools, setMCPTools] = useLocalStorage<
    Record<string, ai.ToolDesc[]>
  >("ailoy/mcpTools", {});
  const [selectedMCPTools, setSelectedMCPTools] = useLocalStorage<
    Record<string, string[]>
  >("ailoy/selectedMCPTools", {});

  const [agentRunConfig, setAgentRunConfig] = useLocalStorage<ai.AgentConfig>(
    "ailoy/agentRunConfig",
    {},
  );
  const [systemPrompt, setSystemPrompt] = useLocalStorage<string>(
    "ailoy/systemPrompt",
    "",
  );

  const [agentInitialized, setAgentInitialized] = useState<boolean>(false);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(false);
  const [modelLoadingProgress, setModelLoadingProgress] = useState<
    ai.CacheProgress | undefined
  >(undefined);

  const agentWorkerRef = useRef<Worker | null>(null);
  const [agentWorkerReady, setAgentWorkerReady] = useState<boolean>(false);

  // set isWebGPUSupported
  useEffect(() => {
    (async () => {
      const { supported } = await ai.isWebGPUSupported();
      setIsWebGPUSupported(supported);

      if (supported) {
        const adapter = await navigator.gpu.requestAdapter();
        setWebgpuLimits(adapter?.limits);
      }
    })();
  }, []);

  // set agent worker
  // biome-ignore lint/correctness/useExhaustiveDependencies: initialize worker only once
  useEffect(() => {
    const worker = new Worker(
      new URL("@/workers/agent.worker.ts", import.meta.url),
      { type: "module" },
    );
    agentWorkerRef.current = worker;
    agentWorkerRef.current.onmessage = async (e: MessageEvent<OutData>) => {
      const msg = e.data;
      if (msg.type === "worker-ready") {
        setAgentWorkerReady(true);
      } else if (msg.type === "langmodel-init-progress") {
        setModelLoadingProgress(msg.progress);
      } else if (msg.type === "agent-ready") {
        setModelLoadingProgress(undefined);
        setIsModelLoading(false);
        setAgentInitialized(true);
      } else if (msg.type === "agent-stream-delta") {
        agentStreamEventTarget.dispatchEvent(
          new CustomEvent<ai.MessageDeltaOutput>("agent-stream-delta", {
            detail: msg.output,
          }),
        );
      } else if (msg.type === "agent-stream-finished") {
        agentStreamEventTarget.dispatchEvent(
          new CustomEvent("agent-stream-finished"),
        );
      } else if (msg.type === "mcp-server-registered") {
        // Update tools of MCP server
        setMCPTools((prev) => ({
          ...prev,
          [msg.url]: msg.tools,
        }));
        setMCPServersStatus((prev) => ({
          ...prev,
          [msg.url]: "initialized",
        }));
        mcpEventTarget.dispatchEvent(
          new CustomEvent<MCPServerRegistered>("mcp-server-registered", {
            detail: msg,
          }),
        );
      } else if (msg.type === "error") {
        console.error(msg.error);
      }
    };
    return () => {
      if (agentWorkerRef.current) {
        agentWorkerRef.current.terminate();
      }
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: false-positive
  useEffect(() => {
    if (!agentWorkerReady) return;

    if (selectedModel === undefined) {
      return;
    }
    if (selectedModel.type === "local" && !isWebGPUSupported) {
      return;
    }
    if (
      selectedModel.type === "api" &&
      apiKeys[selectedModel.spec] === undefined
    ) {
      return;
    }

    setAgentInitialized(false);
    setIsModelLoading(true);
    if (selectedModel.type === "local") {
      agentWorkerRef.current?.postMessage({
        type: "initialize-local-agent",
        config: selectedModel,
      } as InitializeLocalAgent);
    } else {
      agentWorkerRef.current?.postMessage({
        type: "initialize-api-agent",
        config: selectedModel,
        apiKey: apiKeys[selectedModel.spec],
      } as InitializeApiAgent);
    }
  }, [selectedModel, isWebGPUSupported, agentWorkerReady]);

  useEffect(() => {
    if (!agentInitialized) return;

    agentWorkerRef.current?.postMessage({
      type: "clear-tools",
    } as ClearTools);

    for (const tool of selectedBuiltinTools) {
      if (tool.id === "web_search_duckduckgo") {
        agentWorkerRef.current?.postMessage({
          type: "add-builtin-tool",
          name: tool.id,
          config: {
            base_url:
              "https://web-example-proxy.ailoy.co/web-search-duckduckgo",
          },
        } as AddBuiltinTool);
      } else if (tool.id === "web_fetch") {
        agentWorkerRef.current?.postMessage({
          type: "add-builtin-tool",
          name: tool.id,
          config: {
            proxy_url: "https://web-example-proxy.ailoy.co/web-fetch",
          },
        });
      }
    }
  }, [agentInitialized, selectedBuiltinTools]);

  // Initialize MCP servers after worker is initialized
  useEffect(() => {
    if (!agentWorkerReady) return;
    for (const server of mcpServers) {
      if (mcpServersStatus[server.url] === undefined) {
        agentWorkerRef.current?.postMessage({
          type: "add-mcp-server",
          url: server.url,
        } as AddMCPServer);
        mcpServersStatus[server.url] = "initializing";
      }
    }
  }, [agentWorkerReady, mcpServers, mcpServersStatus]);

  // Add selected MCP tools after agent is initialized
  useEffect(() => {
    if (!agentInitialized) return;

    for (const server of mcpServers) {
      for (const tool of selectedMCPTools[server.url] ?? []) {
        agentWorkerRef.current?.postMessage({
          type: "add-mcp-tool",
          url: server.url,
          name: tool,
        } as AddMCPTool);
      }
    }
  }, [agentInitialized, mcpServers, selectedMCPTools]);

  const setApiKey = (provider: keyof APIKeys, key: string | undefined) => {
    setApiKeys((prev) => ({ ...prev, [provider]: key }));
  };

  const addMCPServer = (url: string) => {
    agentWorkerRef.current?.postMessage({
      type: "add-mcp-server",
      url,
    } as AddMCPServer);
    setMCPServers([...mcpServers, { url }]);
  };

  const removeMCPServer = (url: string) => {
    agentWorkerRef.current?.postMessage({
      type: "remove-mcp-server",
      url,
    } as RemoveMCPServer);
    setMCPServers((prev) => prev.filter((server) => server.url !== url));
    setMCPServersStatus((prev) => {
      const { [url]: _, ...rest } = prev;
      return rest;
    });
  };

  const addMCPTool = (url: string, name: string) => {
    setSelectedMCPTools({
      ...selectedMCPTools,
      [url]:
        selectedMCPTools[url] !== undefined
          ? [...selectedMCPTools[url], name]
          : [name],
    });
    agentWorkerRef.current?.postMessage({
      type: "add-mcp-tool",
      url,
      name,
    } as AddMCPTool);
  };

  const removeMCPTool = (url: string, name: string) => {
    setSelectedMCPTools({
      ...selectedMCPTools,
      [url]: selectedMCPTools[url]?.filter((t) => t !== name),
    });
    agentWorkerRef.current?.postMessage({
      type: "remove-tool",
      name,
    } as RemoveTool);
  };

  const runAgent = useCallback(
    (messages: ai.Message[]) => {
      if (!agentInitialized) return;

      if (systemPrompt !== "") {
        messages = [
          { role: "system", contents: [{ type: "text", text: systemPrompt }] },
          ...messages,
        ];
      }

      agentWorkerRef.current?.postMessage({
        type: "run-agent",
        messages,
        agentRunConfig,
      } as RunAgent);
    },
    [agentInitialized, systemPrompt, agentRunConfig],
  );

  return (
    <AiloyAgentContext.Provider
      value={{
        isWebGPUSupported,
        webgpuLimits,
        agentInitialized,
        isModelLoading,
        modelLoadingProgress,
        downloadedModels,
        setDownloadedModels,
        selectedModel,
        setSelectedModel,
        apiKeys,
        setApiKey,
        agentRunConfig,
        setAgentRunConfig,
        systemPrompt,
        setSystemPrompt,
        selectedBuiltinTools,
        setSelectedBuiltinTools,
        mcpServers,
        addMCPServer,
        removeMCPServer,
        mcpTools,
        selectedMCPTools,
        addMCPTool,
        removeMCPTool,
        runAgent,
      }}
    >
      {children}
    </AiloyAgentContext.Provider>
  );
}

export function useAiloyAgentContext() {
  const context = useContext(AiloyAgentContext);
  if (!context) {
    throw new Error(
      "useAiloyAgentContext must be used within AiloyAgentProvider",
    );
  }
  return context;
}
