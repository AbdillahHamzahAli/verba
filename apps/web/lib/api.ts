const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ─── Setup ──────────────────────────────────────────

export async function checkSetupStatus(): Promise<{ configured: boolean }> {
  const res = await fetch(`${API_BASE}/api/setup/status`);
  if (!res.ok) throw new Error("Failed to check setup status");
  return res.json();
}

export async function saveApiKey(apiKey: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/setup/api-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to save API key");
  }
}

// ─── Multi API Key Management ───────────────────────

export interface ApiKeyInfo {
  label: string;
  masked: string;
  length: number;
  active: boolean;
  createdAt: string;
}

export async function getApiKeys(): Promise<ApiKeyInfo[]> {
  const res = await fetch(`${API_BASE}/api/setup/api-keys`);
  if (!res.ok) throw new Error("Failed to fetch API keys");
  return res.json();
}

export async function addApiKey(label: string, apiKey: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/setup/api-keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label, apiKey }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to add API key");
  }
}

export async function activateApiKey(label: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/setup/api-keys/${encodeURIComponent(label)}/activate`,
    { method: "PUT" },
  );
  if (!res.ok) throw new Error("Failed to activate API key");
}

export async function deleteApiKey(label: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/setup/api-keys/${encodeURIComponent(label)}`,
    { method: "DELETE" },
  );
  if (!res.ok) throw new Error("Failed to delete API key");
}

// ─── Connections ────────────────────────────────────

export interface ConnectionInput {
  name: string;
  type: "postgres" | "mysql";
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface Connection {
  id: number;
  name: string;
  type: "postgres" | "mysql";
  host: string;
  port: number;
  database: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export async function getConnections(): Promise<Connection[]> {
  const res = await fetch(`${API_BASE}/api/connections`);
  if (!res.ok) throw new Error("Failed to fetch connections");
  return res.json();
}

export async function createConnection(
  input: ConnectionInput,
): Promise<Connection> {
  const res = await fetch(`${API_BASE}/api/connections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to create connection");
  }
  return res.json();
}

export async function deleteConnection(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/connections/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete connection");
}

export async function testConnection(
  id: number,
): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${API_BASE}/api/connections/${id}/test`, {
    method: "POST",
  });
  return res.json();
}

// ─── Chat (SSE Streaming) ──────────────────────────

export interface ChatEvent {
  type: "thought" | "tool_call" | "tool_result" | "answer" | "error" | "done";
  content: string;
}

export async function* streamChat(
  connectionId: number,
  question: string,
): AsyncGenerator<ChatEvent> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ connectionId, question }),
  });

  if (!res.ok) {
    throw new Error("Failed to start chat stream");
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Parse SSE events from buffer
    const lines = buffer.split("\n");
    buffer = lines.pop() || ""; // Keep incomplete line in buffer

    let currentEventType = "";

    for (const line of lines) {
      if (line.startsWith("event: ")) {
        currentEventType = line.slice(7).trim();
      } else if (line.startsWith("data: ") && currentEventType) {
        try {
          const data = JSON.parse(line.slice(6));
          if (currentEventType === "done") {
            return;
          }
          yield {
            type: currentEventType as ChatEvent["type"],
            content: data.content || "",
          };
        } catch {
          // Skip malformed JSON
        }
        currentEventType = "";
      }
    }
  }
}
