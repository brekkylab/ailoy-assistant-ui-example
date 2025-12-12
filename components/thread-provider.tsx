import type {
  ExternalStoreThreadData,
  ExternalStoreThreadListAdapter,
} from "@assistant-ui/react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { AssistantUiMessage } from "@/lib/message-converter";
import { useAiloyAgentContext } from "./ailoy-agent-provider";

// Create a context for thread management
const ThreadContext = createContext<{
  currentThreadId: string;
  setCurrentThreadId: (id: string) => void;
  threads: Map<string, AssistantUiMessage[]>;
  setThreads: React.Dispatch<
    React.SetStateAction<Map<string, AssistantUiMessage[]>>
  >;
  currentThreadMessages: AssistantUiMessage[];
  appendThreadMessage: (threadId: string, message: AssistantUiMessage) => void;
  setThreadMessages: (threadId: string, messages: AssistantUiMessage[]) => void;
  renameThread: (threadId: string, newTitle: string) => void;
  threadListAdapter: ExternalStoreThreadListAdapter;
}>({
  currentThreadId: "default",
  setCurrentThreadId: () => {},
  threads: new Map(),
  setThreads: () => {},
  currentThreadMessages: [],
  appendThreadMessage: () => {},
  setThreadMessages: () => {},
  renameThread: () => {},
  threadListAdapter: {},
});

export function ThreadProvider({ children }: { children: ReactNode }) {
  const [threadList, setThreadList] = useState<
    ExternalStoreThreadData<"regular">[]
  >([{ id: "default", status: "regular", title: "New Chat" }]);
  const [threads, setThreads] = useState<Map<string, AssistantUiMessage[]>>(
    new Map([["default", []]]),
  );
  const [currentThreadId, setCurrentThreadId] = useState("default");

  const currentThreadMessages = useMemo(() => {
    return threads.get(currentThreadId) ?? [];
  }, [currentThreadId, threads]);

  const appendThreadMessage = (
    threadId: string,
    newMessage: AssistantUiMessage,
  ) => {
    setThreads((prev) => {
      const next = new Map(prev);
      const messages = next.get(threadId) ?? [];
      next.set(threadId, [...messages, newMessage]);
      return next;
    });
  };

  const setThreadMessages = (
    threadId: string,
    messages: AssistantUiMessage[],
  ) => {
    setThreads((prev) => {
      const next = new Map(prev);
      next.set(threadId, messages);
      return next;
    });
  };

  const renameThread = (threadId: string, newTitle: string) => {
    setThreadList((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, title: newTitle } : t)),
    );
  };

  const { isModelLoading, selectedModel } = useAiloyAgentContext();

  // biome-ignore lint/correctness/useExhaustiveDependencies: threads should be cleared on selectedModel changes
  useEffect(() => {
    // Clear all threads whenever modelConfig is changed
    setThreadList([{ id: "default", status: "regular", title: "New Chat" }]);
    setThreads(new Map([["default", []]]));
  }, [selectedModel]);

  const threadListAdapter: ExternalStoreThreadListAdapter = {
    threadId: currentThreadId,
    threads: threadList,
    isLoading: isModelLoading,
    onSwitchToNewThread: () => {
      const newId = `thread-${Date.now()}`;
      setThreadList((prev) => [
        ...prev,
        {
          id: newId,
          status: "regular",
          title: "New Chat",
        },
      ]);
      setThreads((prev) => new Map(prev).set(newId, []));
      setCurrentThreadId(newId);
    },
    onSwitchToThread: (threadId) => {
      setCurrentThreadId(threadId);
    },
    onRename: (threadId, newTitle) => {
      setThreadList((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, title: newTitle } : t)),
      );
    },
    onDelete: (threadId) => {
      setThreadList((prev) => prev.filter((t) => t.id !== threadId));
      setThreads((prev) => {
        const next = new Map(prev);
        next.delete(threadId);
        return next;
      });
      if (currentThreadId === threadId) {
        setCurrentThreadId("default");
      }
    },
  };

  return (
    <ThreadContext.Provider
      value={{
        currentThreadId,
        setCurrentThreadId,
        threads,
        setThreads,
        currentThreadMessages,
        appendThreadMessage,
        setThreadMessages,
        renameThread,
        threadListAdapter,
      }}
    >
      {children}
    </ThreadContext.Provider>
  );
}

// Hook for accessing thread context
export function useThreadContext() {
  const context = useContext(ThreadContext);
  if (!context) {
    throw new Error("useThreadContext must be used within ThreadProvider");
  }
  return context;
}
