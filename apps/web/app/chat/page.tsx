"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getConnections,
  streamChat,
  type Connection,
  type ChatEvent,
} from "@/lib/api";
import { ChatMessage } from "@/components/chat-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Database02Icon,
  ArrowUpRight01Icon,
  ArrowLeft01Icon,
  AiBrain01Icon,
} from "@hugeicons/core-free-icons";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  events?: ChatEvent[];
}

function ChatPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const connectionId = Number(searchParams.get("connectionId"));

  const [connection, setConnection] = useState<Connection | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load connection info
  useEffect(() => {
    if (!connectionId) return;
    getConnections().then((conns) => {
      const conn = conns.find((c) => c.id === connectionId);
      setConnection(conn || null);
    });
  }, [connectionId]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || streaming || !connectionId) return;

    setInput("");
    setStreaming(true);

    // Add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
    };

    // Add placeholder assistant message
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      events: [],
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    try {
      for await (const event of streamChat(connectionId, question)) {
        setMessages((prev) => {
          const lastIdx = prev.length - 1;
          const lastMsg = prev[lastIdx];
          if (!lastMsg || lastMsg.role !== "assistant") return prev;
          // Create a new message object — never mutate existing refs
          const updated: Message = {
            ...lastMsg,
            events: [...(lastMsg.events || []), event],
            content: event.type === "answer" ? event.content : lastMsg.content,
          };
          return [...prev.slice(0, lastIdx), updated];
        });
      }
    } catch (err) {
      setMessages((prev) => {
        const lastIdx = prev.length - 1;
        const lastMsg = prev[lastIdx];
        if (!lastMsg || lastMsg.role !== "assistant") return prev;
        const errorEvent: ChatEvent = {
          type: "error",
          content: err instanceof Error ? err.message : "Connection failed",
        };
        const updated: Message = {
          ...lastMsg,
          events: [...(lastMsg.events || []), errorEvent],
        };
        return [...prev.slice(0, lastIdx), updated];
      });
    } finally {
      setStreaming(false);
    }
  };

  if (!connectionId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-6">
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              No connection selected.
            </p>
            <Button
              onClick={() => router.push("/connections")}
              className="cursor-pointer"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4" />
              Back to Connections
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 3.5rem)" }}>
      {/* Header */}
      <header className="border-b border-border/60 bg-card/50 backdrop-blur-xl px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => router.push("/connections")}
              className="cursor-pointer"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <HugeiconsIcon
                  icon={Database02Icon}
                  className="w-4 h-4 text-primary"
                />
              </div>
              <div>
                <h1 className="text-sm font-semibold">
                  {connection?.name || "Loading..."}
                </h1>
                {connection && (
                  <p className="text-xs text-muted-foreground">
                    {connection.host}:{connection.port}/{connection.database}
                  </p>
                )}
              </div>
            </div>
          </div>
          {connection && (
            <Badge variant="secondary" className="text-xs">
              {connection.type === "postgres" ? "PostgreSQL" : "MySQL"}
            </Badge>
          )}
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                <HugeiconsIcon
                  icon={AiBrain01Icon}
                  className="w-8 h-8 text-primary"
                />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Ask anything about your data
              </h2>
              <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                Ask questions in natural language and Verba will translate them
                to SQL, execute safely, and show you the results.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 max-w-lg w-full">
                {[
                  "Show me all tables in the database",
                  "How many records are in each table?",
                  "What are the most recent entries?",
                  "Show me the schema of the main table",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="text-left text-sm px-4 py-3 rounded-xl border border-border/40 bg-card/50 hover:bg-card/80 hover:border-primary/30 transition-all cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.role === "user" ? (
                    <div className="flex justify-end py-2">
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%]">
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2">
                      {msg.events && msg.events.length > 0 ? (
                        <div className="space-y-1">
                          {msg.events.map((event, i) => (
                            <ChatMessage key={i} event={event} />
                          ))}
                        </div>
                      ) : streaming ? (
                        <div className="flex items-center gap-2 py-2">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                          <span className="text-sm text-muted-foreground">
                            Thinking...
                          </span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-border/60 bg-card/50 backdrop-blur-xl px-6 py-4">
        <form
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto flex items-center gap-3"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your data..."
            disabled={streaming}
            className="flex-1 h-11 bg-background/50"
            autoFocus
          />
          <Button
            type="submit"
            disabled={streaming || !input.trim()}
            className="h-11 px-5 cursor-pointer"
          >
            {streaming ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <HugeiconsIcon icon={ArrowUpRight01Icon} className="w-5 h-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ChatPageInner />
    </Suspense>
  );
}
