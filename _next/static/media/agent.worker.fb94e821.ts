/// <reference lib="webworker" />
/** biome-ignore-all lint/suspicious/noExplicitAny: false-positive */

import * as ai from "ailoy-web";

import type {
  AiloyAPILMConfig,
  AiloyLocalLMConfig,
} from "@/components/ailoy-agent-provider";

let agent: ai.Agent | undefined;
const mcpClients: Map<string, ai.MCPClient> = new Map();

export interface InitializeLocalAgent {
  type: "initialize-local-agent";
  config: AiloyLocalLMConfig;
}

export interface InitializeApiAgent {
  type: "initialize-api-agent";
  config: AiloyAPILMConfig;
  apiKey: string;
}

export interface RunAgent {
  type: "run-agent";
  messages: ai.Message[];
  config?: ai.AgentConfig;
}

export interface AddBuiltinTool {
  type: "add-builtin-tool";
  name: ai.BuiltinToolKind;
  config?: Record<string, any>;
}

export interface AddMCPServer {
  type: "add-mcp-server";
  url: string;
}

export interface RemoveMCPServer {
  type: "remove-mcp-server";
  id: string;
}

export interface AddMCPTool {
  type: "add-mcp-tool";
  url: string;
  name: string;
}

export interface RemoveTool {
  type: "remove-tool";
  name: string;
}

export interface ClearTools {
  type: "clear-tools";
}

type InData =
  | InitializeLocalAgent
  | InitializeApiAgent
  | RunAgent
  | AddBuiltinTool
  | AddMCPServer
  | RemoveMCPServer
  | AddMCPTool
  | RemoveTool
  | ClearTools;

export interface WorkerReady {
  type: "worker-ready";
}

export interface LangModelInitProgress {
  type: "langmodel-init-progress";
  progress: ai.CacheProgress;
}

export interface AgentReady {
  type: "agent-ready";
}

export interface AgentStreamDelta {
  type: "agent-stream-delta";
  output: ai.MessageDeltaOutput;
}

export interface AgentStreamFinished {
  type: "agent-stream-finished";
}

export interface MCPServerRegistered {
  type: "mcp-server-registered";
  id: string;
  url: string;
  tools: ai.ToolDesc[];
}

export interface ErrorMessage {
  type: "error";
  error: string;
}

export type OutData =
  | WorkerReady
  | LangModelInitProgress
  | AgentReady
  | AgentStreamDelta
  | AgentStreamFinished
  | MCPServerRegistered
  | ErrorMessage;

async function initializeLocalAgent(config: AiloyLocalLMConfig) {
  try {
    const model = await ai.LangModel.newLocal(config.modelName, {
      progressCallback: (prog) => {
        self.postMessage({
          type: "langmodel-init-progress",
          progress: prog,
        } as LangModelInitProgress);
      },
    });
    agent = new ai.Agent(model);
    self.postMessage({ type: "agent-ready" } as AgentReady);
  } catch (err) {
    self.postMessage({
      type: "error",
      error: (err as Error)?.message || String(err),
    } as ErrorMessage);
  }
}

async function initializeAPIAgent(config: AiloyAPILMConfig, apiKey: string) {
  try {
    const model = await ai.LangModel.newStreamAPI(
      config.spec,
      config.modelName,
      apiKey,
    );
    agent = new ai.Agent(model);
    self.postMessage({ type: "agent-ready" } as AgentReady);
  } catch (err) {
    self.postMessage({
      type: "error",
      error: (err as Error)?.message || String(err),
    } as ErrorMessage);
  }
}

async function runAgent(messages: ai.Message[], config?: ai.AgentConfig) {
  if (agent === undefined) return;

  for await (const output of agent.runDelta(messages, config)) {
    self.postMessage({
      type: "agent-stream-delta",
      output,
    } as AgentStreamDelta);
  }
  self.postMessage({
    type: "agent-stream-finished",
  } as AgentStreamFinished);
}

function addBuiltinTool(
  name: ai.BuiltinToolKind,
  config?: Record<string, any>,
) {
  if (agent === undefined) return;

  const tool = ai.Tool.newBuiltin(name, config);
  agent.addTool(tool);
}

async function addMCPServer(url: string) {
  if (mcpClients.has(url)) return;
  try {
    const mcpClient = await ai.MCPClient.streamableHttp(url);
    mcpClients.set(url, mcpClient);

    const tools = mcpClient.tools.map((t) => t.description);
    self.postMessage({
      type: "mcp-server-registered",
      url,
      tools,
    } as MCPServerRegistered);
  } catch (err) {
    self.postMessage({
      type: "error",
      error: (err as Error)?.message || String(err),
    } as ErrorMessage);
  }
}

function removeMCPServer(id: string) {
  const mcpClient = mcpClients.get(id);
  if (mcpClient === undefined) return;
  if (agent === undefined) return;
  for (const tool of mcpClient.tools) {
    agent.removeTool(tool.description.name);
  }
  mcpClients.delete(id);
}

function addMCPTool(url: string, name: string) {
  if (agent === undefined) return;

  const mcpClient = mcpClients.get(url);
  if (mcpClient === undefined) return;

  const tool = mcpClient.tools.find((t) => t.description.name === name);
  if (tool === undefined) return;

  agent.addTool(tool);
}

function removeTool(name: string) {
  if (agent === undefined) return;
  agent.removeTool(name);
}

function clearTools() {
  if (agent === undefined) return;
  agent.clearTools();
}

self.onmessage = async (e: MessageEvent<InData>) => {
  const msg = e.data;

  if (msg.type === "initialize-local-agent") {
    await initializeLocalAgent(msg.config);
  } else if (msg.type === "initialize-api-agent") {
    await initializeAPIAgent(msg.config, msg.apiKey);
  } else if (msg.type === "run-agent") {
    await runAgent(msg.messages, msg.config);
  } else if (msg.type === "add-builtin-tool") {
    addBuiltinTool(msg.name, msg.config);
  } else if (msg.type === "add-mcp-server") {
    await addMCPServer(msg.url);
  } else if (msg.type === "remove-mcp-server") {
    removeMCPServer(msg.id);
  } else if (msg.type === "add-mcp-tool") {
    addMCPTool(msg.url, msg.name);
  } else if (msg.type === "remove-tool") {
    removeTool(msg.name);
  } else if (msg.type === "clear-tools") {
    clearTools();
  }
};
self.postMessage({ type: "worker-ready" });
