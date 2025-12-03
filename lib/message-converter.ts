import {
  type ThreadMessageLike,
  type ThreadMessage,
  type ImageMessagePart,
  type TextMessagePart,
  type ReasoningMessagePart,
  type SourceMessagePart,
  type FileMessagePart,
  type Unstable_AudioMessagePart,
} from "@assistant-ui/react";
import * as ai from "ailoy-web";

type ReadonlyJSONValue =
  | null
  | string
  | number
  | boolean
  | ReadonlyJSONObject
  | ReadonlyJSONArray;

type ReadonlyJSONArray = readonly ReadonlyJSONValue[];

type ReadonlyJSONObject = {
  readonly [key: string]: ReadonlyJSONValue;
};

export type AssistantUiMessage =
  | ThreadMessageLike
  | {
      role: "tool";
      toolCallId: string;
      toolName?: string | undefined;
      result: any;
    };

export type AssistantUiToolCallPart = {
  type: "tool-call";
  toolCallId?: string;
  toolName: string;
  args?: ReadonlyJSONObject;
  argsText?: string;
  artifact?: any;
  result?: any | undefined;
  isError?: boolean | undefined;
  parentId?: string | undefined;
  messages?: readonly ThreadMessage[] | undefined;
};

export type AssistantUiMessagePart =
  | TextMessagePart
  | ReasoningMessagePart
  | SourceMessagePart
  | ImageMessagePart
  | FileMessagePart
  | Unstable_AudioMessagePart
  | AssistantUiToolCallPart;

function imageDataToBase64(arr: Uint8Array): string {
  let binaryString = "";
  arr.forEach((byte) => {
    binaryString += String.fromCharCode(byte);
  });
  const base64String = btoa(binaryString);
  return `data:image/png;base64,${base64String}`;
}

export function convertContentPart(part: ai.Part): AssistantUiMessagePart {
  switch (part.type) {
    case "text":
      return { type: "text", text: part.text };
    case "value":
      return { type: "text", text: part.value!.toString() };
    case "image":
      let imageUrl: string;
      if (part.image.type === "binary") {
        imageUrl = imageDataToBase64(part.image.data);
      } else {
        imageUrl = part.image.url;
      }
      return { type: "image", image: imageUrl };
    case "function":
      let converted: AssistantUiToolCallPart = {
        type: "tool-call",
        toolCallId: part.id ?? "",
        toolName: part.function.name,
      };
      if (typeof part.function.arguments === "string") {
        converted.argsText = part.function.arguments;
      } else if (typeof part.function.arguments === "object") {
        converted.args = part.function.arguments as ReadonlyJSONObject;
      }
      return converted;
  }
}

export function convertMessage(message: ai.Message): AssistantUiMessage {
  switch (message.role) {
    case "system":
      return {
        role: "system",
        content: message.contents.map((part) => convertContentPart(part)),
      };
    case "user":
      return {
        role: "user",
        content: message.contents.map((part) => convertContentPart(part)),
      };
    case "assistant":
      let contents: AssistantUiMessagePart[] = [];
      if (message.thinking) {
        contents.push({
          type: "reasoning",
          text: message.thinking,
        });
      }
      if (message.tool_calls && message.tool_calls.length > 0) {
        contents = [
          ...contents,
          ...message.tool_calls.map((toolCall) => convertContentPart(toolCall)),
        ];
      }
      contents = [
        ...contents,
        ...message.contents.map((part) => convertContentPart(part)),
      ];
      return {
        role: "assistant",
        content: contents,
      };
    case "tool":
      const part = message.contents[0];
      let toolResult: string;
      if (part.type === "text") {
        toolResult = part.text;
      } else if (part.type === "value") {
        toolResult = JSON.stringify(part.value);
      } else {
        toolResult = "";
      }

      return {
        role: "tool",
        toolCallId: message.id ?? "",
        result: toolResult,
      };
  }
}

export function convertContentPartDelta(
  delta: ai.PartDelta,
): AssistantUiMessagePart {
  switch (delta.type) {
    case "text":
      return {
        type: "text",
        text: delta.text,
      };
    case "value":
      return {
        type: "text",
        text: delta.value!.toString(),
      };
    case "function":
      if (delta.function.type === "verbatim") {
        return { type: "text", text: delta.function.text };
      } else if (delta.function.type === "with_string_args") {
        return {
          type: "text",
          text: `{"name": "${delta.function.name}", "arguments": ${delta.function.arguments}}`,
        };
      } else {
        return {
          type: "text",
          text: `{"name": "${delta.function.name}", "arguments": ${delta.function.arguments}}`,
        };
      }
    case "null":
      return { type: "text", text: "" };
  }
}

export function convertMessageDelta(
  delta: ai.MessageDelta,
): AssistantUiMessage {
  // MessageDelta is generated only for "assistant" and "tool" role.
  switch (delta.role) {
    case "assistant":
      let contents: AssistantUiMessagePart[] = [];
      if (delta.thinking) {
        contents.push({
          type: "reasoning",
          text: delta.thinking,
        });
      }
      if (delta.tool_calls.length > 0) {
        contents = [
          ...contents,
          ...delta.tool_calls.map((toolCall) =>
            convertContentPartDelta(toolCall),
          ),
        ];
      }
      contents = [
        ...contents,
        ...delta.contents.map((part) => convertContentPartDelta(part)),
      ];
      return {
        role: "assistant",
        content: contents,
      };
    case "tool":
      let toolResult = (
        convertContentPartDelta(delta.contents[0]) as TextMessagePart
      ).text;
      return {
        role: "tool",
        toolCallId: delta.id ?? "",
        result: toolResult,
      };
    default:
      // Consider this case as an empty assistant message
      return {
        role: "assistant",
        content: [],
      };
  }
}

export function restoreMessages(messages: AssistantUiMessage[]): ai.Message[] {
  let restored: ai.Message[] = [];
  for (const msg of messages) {
    // Skip tool results
    if (msg.role === "tool") {
      continue;
    }

    let contents: ai.Part[] = [];
    for (const content of msg.content) {
      if (typeof content === "string") {
        contents.push({ type: "text", text: content });
      } else if (content.type === "text") {
        contents.push({ type: "text", text: content.text });
      } else if (content.type === "reasoning") {
        // Skip reasoning
      } else if (content.type === "tool-call") {
        // Skip tool calls
      } else if (content.type === "image") {
        contents.push({
          type: "image",
          image: { type: "url", url: content.image },
        });
      } else {
        throw new Error("Unsupported content type");
      }
    }
    restored.push({
      role: msg.role,
      contents,
    });
  }
  return restored;
}
