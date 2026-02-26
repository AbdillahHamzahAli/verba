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
