import { useState, useMemo, type ReactNode } from "react";
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  useExternalMessageConverter,
  CompositeAttachmentAdapter,
  SimpleImageAttachmentAdapter,
  SimpleTextAttachmentAdapter,
  type AppendMessage,
} from "@assistant-ui/react";
import * as ai from "ailoy-web";
import { useThreadContext } from "./thread-provider";
import { useAiloyAgentContext } from "./ailoy-agent-provider";
import {
  convertMessage,
  convertMessageDelta,
  AssistantUiMessage,
  restoreMessages,
} from "@/lib/message-converter";

export function AiloyRuntimeProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [ongoingMessage, setOngoingMessage] = useState<ai.MessageDelta | null>(
    null,
  );
  const [isAnswering, setIsAnswering] = useState<boolean>(false);

  const { agent, isModelLoading, isReasoning } = useAiloyAgentContext();

  const {
    currentThreadId,
    currentThreadMessages,
    appendThreadMessage,
    renameThread,
    threadListAdapter,
  } = useThreadContext();

  const onNew = async (message: AppendMessage) => {
    if (agent === undefined) throw new Error("Agent is not initialized yet");

    let userContents: ai.Part[] = [];

    // Add attachments
    if (message.attachments !== undefined) {
      for (const attach of message.attachments) {
        if (attach.type === "image") {
          const ab = await attach.file!.arrayBuffer();
          const arr = new Uint8Array(ab);
          const imagePart = ai.imageFromBytes(arr);
          userContents.push(imagePart);
        }
        // other types are skipped
      }
    }

    // Add text prompt
    if (message.content[0]?.type !== "text")
      throw new Error("Only text messages are supported");
    userContents.push({ type: "text", text: message.content[0].text });

    // Set messages
    const newMessage: ai.Message = {
      role: "user",
      contents: userContents,
    };
    appendThreadMessage(currentThreadId, convertMessage(newMessage));
    // Rename thread if this is a first message in this thread
    if (currentThreadMessages.length === 0) {
      renameThread(currentThreadId, message.content[0].text.substring(0, 30));
    }

    setIsAnswering(true);

    let accumulated: ai.MessageDelta | null = null;
    for await (const { delta, finish_reason } of agent.runDelta(
      [...restoreMessages(currentThreadMessages), newMessage],
      {
        inference: {
          thinkEffort: isReasoning ? "enable" : "disable",
        },
      },
    )) {
      accumulated =
        accumulated === null
          ? delta
          : ai.accumulateMessageDelta(accumulated, delta);
      setOngoingMessage({ ...accumulated });

      if (finish_reason !== undefined) {
        let newMessage = ai.finishMessageDelta(accumulated);
        appendThreadMessage(currentThreadId, convertMessage(newMessage));
        setOngoingMessage(null);
        accumulated = null;
      }
    }
    setIsAnswering(false);
  };

  const convertedMessages: AssistantUiMessage[] = useMemo(() => {
    let messages = currentThreadMessages;
    if (ongoingMessage !== null) {
      let convertedDelta = convertMessageDelta(ongoingMessage);
      messages = [...messages, convertedDelta];
    }
    return messages;
  }, [currentThreadMessages, ongoingMessage]);

  const runtime = useExternalStoreRuntime({
    isLoading: isModelLoading,
    isDisabled: agent === undefined,
    isRunning: isAnswering,
    messages: useExternalMessageConverter({
      messages: convertedMessages,
      callback: (msg) => msg,
      isRunning: isAnswering,
    }),
    onNew,
    adapters: {
      attachments: new CompositeAttachmentAdapter([
        new SimpleImageAttachmentAdapter(),
        new SimpleTextAttachmentAdapter(),
      ]),
      threadList: threadListAdapter,
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
