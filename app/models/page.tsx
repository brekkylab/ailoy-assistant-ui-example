"use client";

import * as ai from "ailoy-web";
import { Download, Key, Trash2 } from "lucide-react";
import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";

import {
  type AiloyAPILMConfig,
  type AiloyLocalLMConfig,
  useAiloyAgentContext,
} from "@/components/ailoy-agent-provider";
import { Button } from "@/components/ui/button";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const LocalModelListItem: FC<{
  modelName: string;
}> = ({ modelName }) => {
  const {
    downloadedModels,
    setDownloadedModels,
    selectedModel,
    setSelectedModel,
    isWebGPUSupported,
    isModelLoading,
    modelLoadingProgress,
  } = useAiloyAgentContext();

  const downloaded = useMemo(() => {
    return downloadedModels.includes(modelName);
  }, [downloadedModels, modelName]);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const isCurrentModelLoading = useMemo(() => {
    return selectedModel?.modelName === modelName && isModelLoading;
  }, [selectedModel, isModelLoading, modelName]);

  const handleDownloadModel = async () => {
    setProgress(0);
    setDownloading(true);
    await ai.LangModel.download(modelName, {
      progressCallback: (prog) => {
        const percent = Math.round((prog.current / prog.total) * 100);
        setProgress(percent);
      },
    });
    setDownloading(false);
    setProgress(0);
    setDownloadedModels([...downloadedModels, modelName]);
    // Automatically select the downloaded model
    setSelectedModel({ type: "local", modelName });
  };

  const handleRemoveModel = async () => {
    await ai.LangModel.remove(modelName);
    setDownloadedModels(
      downloadedModels.filter((model) => model !== modelName),
    );
    if (selectedModel?.modelName === modelName) {
      setSelectedModel(undefined);
    }
  };

  useEffect(() => {
    if (!isCurrentModelLoading) {
      setProgress(0);
    }
    if (isCurrentModelLoading && modelLoadingProgress !== undefined) {
      const percent = Math.round(
        (modelLoadingProgress.current / modelLoadingProgress.total) * 100,
      );
      setProgress(percent);
    }
  }, [isCurrentModelLoading, modelLoadingProgress]);

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <RadioGroupItem
            className="cursor-pointer"
            value={modelName}
            id={modelName}
            disabled={!downloaded}
          />
          <Label
            htmlFor={modelName}
            className={`cursor-pointer ${!downloaded ? "text-gray-400" : ""}`}
          >
            {modelName}
          </Label>
        </div>
        <div className="flex gap-2">
          {!downloaded ? (
            <Button
              size="sm"
              onClick={handleDownloadModel}
              disabled={!isWebGPUSupported || downloading}
              className="cursor-pointer gap-2"
            >
              {downloading ? <Spinner /> : <Download size={16} />}
              <span className="hidden sm:inline">
                {downloading ? "Downloading..." : "Download"}
              </span>
            </Button>
          ) : isCurrentModelLoading ? (
            <Button size="sm" variant="outline" disabled>
              <Spinner />
              <span className="hiddne sm:inline">Loading</span>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="destructive"
              disabled={isCurrentModelLoading}
              onClick={handleRemoveModel}
              className="cursor-pointer gap-2"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
        </div>
      </div>
      <div className="h-1 w-full">
        {(downloading || isCurrentModelLoading) && (
          <div
            className="h-1 bg-blue-500 transition-all duration-300"
            style={{
              width: `${progress}%`,
            }}
          ></div>
        )}
      </div>
    </div>
  );
};

const APIModelListItem: FC<{
  config: AiloyAPILMConfig;
}> = ({ config }) => {
  const { selectedModel, setSelectedModel, apiKeys, setApiKey } =
    useAiloyAgentContext();
  const [isDialogOpened, setIsDialogOpened] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>("");

  const isSelectable = apiKeys[config.spec] !== undefined;

  const handleSaveApiKey = () => {
    setApiKey(config.spec, apiKeyInput !== "" ? apiKeyInput : undefined);
    if (selectedModel?.modelName === config.modelName) {
      setSelectedModel(undefined);
    }

    setApiKeyInput("");
    setIsDialogOpened(false);
  };

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <RadioGroupItem
          className="cursor-pointer"
          value={config.modelName}
          id={config.modelName}
          disabled={!isSelectable}
        />
        <Label
          className={`cursor-pointer ${!isSelectable ? "text-muted-foreground" : ""}`}
        >
          {config.modelName}
        </Label>
      </div>
      <Dialog open={isDialogOpened} onOpenChange={setIsDialogOpened}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant={isSelectable ? "outline" : "default"}
            className="cursor-pointer gap-2"
            suppressHydrationWarning
          >
            <Key size={16} />
            <span className="hidden sm:inline">
              {isSelectable ? "Update Key" : "API Key"}
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set API Key for {config.spec}</DialogTitle>
            <DialogDescription>
              Enter your API key to enable this model
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <form className="space-y-2">
              <Label htmlFor="apikey-input">API key</Label>
              <Input
                id="apikey-input"
                type="password"
                autoComplete="off"
                placeholder="Enter your API key"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
              />
            </form>
            <div className="flex justify-end gap-2">
              <Button
                className="cursor-pointer"
                variant="outline"
                onClick={() => setIsDialogOpened(false)}
              >
                Cancel
              </Button>
              <Button className="cursor-pointer" onClick={handleSaveApiKey}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const LOCAL_MODELS: AiloyLocalLMConfig[] = [
  { type: "local", modelName: "Qwen/Qwen3-0.6B" },
  { type: "local", modelName: "Qwen/Qwen3-1.7B" },
  { type: "local", modelName: "Qwen/Qwen3-4B" },
];

const API_MODELS: AiloyAPILMConfig[] = [
  { type: "api", spec: "OpenAI", modelName: "gpt-4o" },
  { type: "api", spec: "Gemini", modelName: "gemini-2.5-flash" },
  { type: "api", spec: "Claude", modelName: "claude-sonnet-4-5" },
  { type: "api", spec: "Grok", modelName: "grok-4-fast" },
];

export default function ModelsPage() {
  const {
    selectedModel,
    setSelectedModel,
    agentRunConfig,
    setAgentRunConfig,
    systemPrompt,
    setSystemPrompt,
    isWebGPUSupported,
  } = useAiloyAgentContext();

  const handleSelectModel = (modelName: string) => {
    // biome-ignore lint/style/noNonNullAssertion: config always exists
    const config = [...LOCAL_MODELS, ...API_MODELS].find(
      (config) => config.modelName === modelName,
    )!;
    setSelectedModel(config);
  };

  const handleReasoningToggle = (reasoning: boolean) => {
    setAgentRunConfig({
      ...agentRunConfig,
      inference: {
        ...agentRunConfig.inference,
        thinkEffort: reasoning ? "enable" : "disable",
      },
    });
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold text-primary">Models</h1>

        {/* Local Models */}
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-bold text-primary">Local Models</h3>
          <div className="space-y-3">
            <RadioGroup
              value={selectedModel?.modelName ?? ""}
              onValueChange={handleSelectModel}
            >
              {LOCAL_MODELS.map((config) => (
                <LocalModelListItem
                  key={config.modelName}
                  modelName={config.modelName}
                />
              ))}
            </RadioGroup>
            {!isWebGPUSupported && (
              <p className="text-destructive">
                Your environment does not support WebGPU acceleration. Try using
                API models instead.
              </p>
            )}
          </div>
        </div>

        {/* API Models */}
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-bold text-primary">API Models</h3>
          <div className="space-y-3">
            <RadioGroup
              value={selectedModel?.modelName ?? ""}
              onValueChange={handleSelectModel}
            >
              {API_MODELS.map((config) => (
                <APIModelListItem key={config.modelName} config={config} />
              ))}
            </RadioGroup>
          </div>
        </div>

        {/* Agent Run Config */}
        <div>
          <h3 className="mb-4 text-lg font-bold text-primary">
            Agent Configuration
          </h3>
          <div className="space-y-4">
            {/* Reasoning */}
            <div className="flex gap-4">
              <Label htmlFor="reasoning">Reasoning</Label>
              <Switch
                id="reasoning"
                className="cursor-pointer"
                checked={agentRunConfig.inference?.thinkEffort === "enable"}
                onCheckedChange={handleReasoningToggle}
              />
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <Label htmlFor="system-prompt">System Prompt</Label>
              <Textarea
                id="system-prompt"
                className="w-full"
                placeholder="Write the system prompt for your agent"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
