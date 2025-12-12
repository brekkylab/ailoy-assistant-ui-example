import {
  type AppendMessage,
  AssistantRuntimeProvider,
  CompositeAttachmentAdapter,
  SimpleImageAttachmentAdapter,
  SimpleTextAttachmentAdapter,
  type TextMessagePart,
  useExternalMessageConverter,
  useExternalStoreRuntime,
} from "@assistant-ui/react";
import * as ai from "ailoy-web";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  type AssistantUiMessage,
  convertMessage,
  convertMessageDelta,
  restoreMessages,
} from "@/lib/message-converter";
import {
  agentStreamEventTarget,
  useAiloyAgentContext,
} from "./ailoy-agent-provider";
import { useThreadContext } from "./thread-provider";

export function AiloyRuntimeProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [ongoingMessage, setOngoingMessage] = useState<ai.MessageDelta | null>(
    null,
  );
  const [isAnswering, setIsAnswering] = useState<boolean>(false);

  const { agentInitialized, runAgent } = useAiloyAgentContext();

  const {
    currentThreadId,
    currentThreadMessages,
    appendThreadMessage,
    setThreadMessages,
    renameThread,
    threadListAdapter,
  } = useThreadContext();

  // biome-ignore lint/correctness/useExhaustiveDependencies: false-positive
  useEffect(() => {
    agentStreamEventTarget.addEventListener(
      "agent-stream-delta",
      accumulateAgentStreamDelta,
    );
    agentStreamEventTarget.addEventListener(
      "agent-stream-finished",
      onAgentStreamFinished,
    );

    return () => {
      agentStreamEventTarget.removeEventListener(
        "agent-stream-delta",
        accumulateAgentStreamDelta,
      );
      agentStreamEventTarget.removeEventListener(
        "agent-stream-finished",
        onAgentStreamFinished,
      );
    };
  }, [currentThreadId]);

  let accumulated: ai.MessageDelta | null = null;
  const accumulateAgentStreamDelta = async (e: Event) => {
    const { delta, finish_reason } = (e as CustomEvent<ai.MessageDeltaOutput>)
      .detail;

    accumulated =
      accumulated === null
        ? delta
        : ai.accumulateMessageDelta(accumulated, delta);

    setOngoingMessage({ ...accumulated });

    if (finish_reason !== undefined) {
      const newMessage = ai.finishMessageDelta(accumulated);
      appendThreadMessage(currentThreadId, convertMessage(newMessage));
      setOngoingMessage(null);
      accumulated = null;
    }
  };

  const onAgentStreamFinished = () => {
    setIsAnswering(false);
  };

  const convertAppendMessage = useCallback(
    async (message: AppendMessage): Promise<ai.Message> => {
      const contents: ai.Part[] = [];

      // Add attachments
      if (message.attachments !== undefined) {
        for (const attach of message.attachments) {
          if (attach.type === "image") {
            // biome-ignore lint/style/noNonNullAssertion: attach should have file
            const ab = await attach.file!.arrayBuffer();
            const arr = new Uint8Array(ab);
            const imagePart = ai.imageFromBytes(arr);
            contents.push(imagePart);
          }
          // other types are skipped
        }
      }

      // Append text part
      if (message.content[0]?.type !== "text")
        throw new Error("Only text messages are supported");
      contents.push({ type: "text", text: message.content[0].text });

      return {
        role: "user",
        contents,
      };
    },
    [],
  );

  const onNew = useCallback(
    async (message: AppendMessage) => {
      if (!agentInitialized) throw new Error("Agent is not initialized yet");

      const newMessage = await convertAppendMessage(message);
      appendThreadMessage(currentThreadId, convertMessage(newMessage));
      // Rename thread if this is a first message in this thread
      if (currentThreadMessages.length === 0) {
        renameThread(
          currentThreadId,
          (message.content[0] as TextMessagePart).text.substring(0, 30),
        );
      }

      runAgent([...restoreMessages(currentThreadMessages), newMessage]);
      setIsAnswering(true);
    },
    [
      agentInitialized,
      currentThreadId,
      currentThreadMessages,
      convertAppendMessage,
      appendThreadMessage,
      renameThread,
      runAgent,
    ],
  );

  const onEdit = useCallback(
    async (message: AppendMessage) => {
      if (!agentInitialized) return;
      const parentIdNum =
        message.parentId !== null ? Number.parseInt(message.parentId, 10) : 0;
      const slicedMessages = currentThreadMessages.slice(0, parentIdNum);
      const editedMessage = await convertAppendMessage(message);
      const messages = [...slicedMessages, convertMessage(editedMessage)];
      setThreadMessages(currentThreadId, messages);
      // Rename thread if this is a first message in this thread
      if (messages.length === 1) {
        renameThread(
          currentThreadId,
          (message.content[0] as TextMessagePart).text.substring(0, 30),
        );
      }

      runAgent(restoreMessages(messages));
      setIsAnswering(true);
    },
    [
      agentInitialized,
      currentThreadId,
      currentThreadMessages,
      convertAppendMessage,
      setThreadMessages,
      renameThread,
      runAgent,
    ],
  );

  const onReload = useCallback(
    async (parentId: string | null) => {
      if (!agentInitialized) return;
      const parentIdNum = parentId !== null ? Number.parseInt(parentId, 10) : 0;
      const slicedMessages = currentThreadMessages.slice(0, parentIdNum + 1);
      setThreadMessages(currentThreadId, slicedMessages);

      runAgent(restoreMessages(slicedMessages));
      setIsAnswering(true);
    },
    [
      agentInitialized,
      currentThreadMessages,
      currentThreadId,
      setThreadMessages,
      runAgent,
    ],
  );

  const convertedMessages: AssistantUiMessage[] = useMemo(() => {
    let messages = currentThreadMessages;
    if (ongoingMessage !== null) {
      const convertedDelta = convertMessageDelta(ongoingMessage);
      messages = [...messages, convertedDelta];
    }
    return messages;
  }, [currentThreadMessages, ongoingMessage]);

  const runtime = useExternalStoreRuntime({
    isDisabled: !agentInitialized,
    isRunning: isAnswering,
    messages: useExternalMessageConverter({
      messages: convertedMessages,
      callback: (msg) => msg,
      isRunning: isAnswering,
    }),
    onNew,
    onEdit,
    onReload,
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
