"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FC, useMemo } from "react";

import { Tool, useAiloyAgentContext } from "@/components/ailoy-agent-provider";

const TOOLS: Tool[] = [
  {
    id: "web_search_duckduckgo",
    name: "Web Search",
    description: "Search the web for information",
    icon: "🔍",
  },
];

const ToolListItem: FC<{ tool: Tool }> = ({ tool }) => {
  const { selectedTools, setSelectedTools } = useAiloyAgentContext();
  const isSelected = useMemo(() => {
    return selectedTools.find((tool) => tool.id) !== undefined;
  }, [selectedTools]);

  const handleToggleTool = (tool: Tool) => {
    if (isSelected) {
      setSelectedTools(selectedTools.filter((t) => t.id !== tool.id));
    } else {
      setSelectedTools([...selectedTools, tool]);
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

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Tools</h1>

        {/* Tools Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            {TOOLS.map((tool) => (
              <ToolListItem key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
