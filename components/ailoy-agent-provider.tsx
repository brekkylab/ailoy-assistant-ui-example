import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import * as ai from "ailoy-web";
import { useLocalStorage } from "@/hooks/use-local-storage";

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
};

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const AiloyAgentContext = createContext<{
  isWebGPUSupported: boolean;
  agent: ai.Agent | undefined;
  isModelLoading: boolean;
  modelLoadingProgress: ai.CacheProgress | undefined;
  downloadedModels: string[];
  setDownloadedModels: (models: string[]) => void;
  selectedModel: AiloyLMConfig | undefined;
  setSelectedModel: (config: AiloyLMConfig | undefined) => void;
  apiKeys: APIKeys;
  setApiKey: (provider: keyof APIKeys, key: string | undefined) => void;
  isReasoning: boolean;
  setIsReasoning: (thinking: boolean) => void;
  selectedTools: Tool[];
  setSelectedTools: (tools: Tool[]) => void;
}>({
  isWebGPUSupported: false,
  agent: undefined,
  isModelLoading: false,
  modelLoadingProgress: undefined,
  downloadedModels: [],
  setDownloadedModels: () => {},
  selectedModel: undefined,
  setSelectedModel: () => {},
  apiKeys: emptyApiKeys,
  setApiKey: () => {},
  isReasoning: false,
  setIsReasoning: () => {},
  selectedTools: [],
  setSelectedTools: () => {},
});

export function AiloyAgentProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [isWebGPUSupported, setIsWebGPUSupported] = useState<boolean>(false);
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
  const [selectedTools, setSelectedTools] = useLocalStorage<Tool[]>(
    "ailoy/selectedTools",
    [],
  );

  const [agent, setAgent] = useState<ai.Agent | undefined>(undefined);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(false);
  const [modelLoadingProgress, setModelLoadingProgress] = useState<
    ai.CacheProgress | undefined
  >(undefined);
  const [isReasoning, setIsReasoning] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const { supported } = await ai.isWebGPUSupported();
      setIsWebGPUSupported(supported);
    })();
  }, []);

  useEffect(() => {
    setAgent(undefined);

    if (selectedModel === undefined) return;
    if (selectedModel.type === "local" && !isWebGPUSupported) {
      return;
    }
    if (
      selectedModel.type === "api" &&
      apiKeys[selectedModel.spec] === undefined
    ) {
      return;
    }

    (async () => {
      setIsModelLoading(true);

      let model: ai.LangModel;
      if (selectedModel.type === "local") {
        model = await ai.LangModel.newLocal(selectedModel.modelName, {
          progressCallback: setModelLoadingProgress,
        });
      } else {
        model = await ai.LangModel.newStreamAPI(
          selectedModel.spec,
          selectedModel.modelName,
          apiKeys[selectedModel.spec]!,
        );
      }

      const agent = new ai.Agent(model);
      setAgent(agent);

      setModelLoadingProgress(undefined);
      setIsModelLoading(false);
    })();
  }, [selectedModel, apiKeys, isWebGPUSupported]);

  useEffect(() => {
    if (agent === undefined) return;

    // TODO: add clearTools
    // agent.clearTools();

    for (const tool of selectedTools) {
      console.log("tool: ", tool);
      if (tool.id === "web_search_duckduckgo") {
        console.log("adding web_search_duckduckgo tool");
        const tool = ai.Tool.newBuiltin("web_search_duckduckgo", {
          base_url: "https://web-example-proxy.ailoy.co",
        });
        agent.addTool(tool);
      }
    }
    setAgent(agent);
  }, [agent, selectedTools]);

  const setApiKey = (provider: keyof APIKeys, key: string | undefined) => {
    setApiKeys((prev) => ({ ...prev, [provider]: key }));
  };

  return (
    <AiloyAgentContext.Provider
      value={{
        isWebGPUSupported,
        agent,
        isModelLoading,
        modelLoadingProgress,
        downloadedModels,
        setDownloadedModels,
        selectedModel,
        setSelectedModel,
        apiKeys,
        setApiKey,
        isReasoning,
        setIsReasoning,
        selectedTools,
        setSelectedTools,
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
