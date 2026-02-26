"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getConnections,
  createConnection,
  deleteConnection,
  testConnection,
  type Connection,
  type ConnectionInput,
} from "@/lib/api";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Database02Icon,
  PlusSignIcon,
  Delete02Icon,
  ServerStack01Icon,
  BubbleChatIcon,
  Cancel01Icon,
  ArrowRight01Icon,
  Plug01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const DB_TYPES = [
  { value: "postgres" as const, label: "PostgreSQL", defaultPort: 5432 },
  { value: "mysql" as const, label: "MySQL", defaultPort: 3306 },
];

const INITIAL_FORM: ConnectionInput = {
  name: "",
  type: "postgres",
  host: "localhost",
  port: 5432,
  database: "",
  username: "",
  password: "",
};

export default function ConnectionsPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ConnectionInput>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<
    Record<number, { success: boolean; error?: string }>
  >({});

  const loadConnections = useCallback(async () => {
    try {
      const data = await getConnections();
      setConnections(data);
    } catch {
      // Silent fail on initial load
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleTypeChange = (type: "postgres" | "mysql") => {
    const dbType = DB_TYPES.find((t) => t.value === type)!;
    setForm((f) => ({ ...f, type, port: dbType.defaultPort }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await createConnection(form);
      setForm(INITIAL_FORM);
      setShowForm(false);
      await loadConnections();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create connection",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteConnection(id);
      await loadConnections();
    } catch {
      // Silent fail
    } finally {
      setDeletingId(null);
    }
  };

  const handleTest = async (id: number) => {
    setTestingId(id);
    try {
      const result = await testConnection(id);
      setTestResults((prev) => ({
        ...prev,
        [id]: {
          success: result.success,
          error: result.success ? undefined : "Connection failed",
        },
      }));
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [id]: { success: false, error: "Connection failed" },
      }));
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20">
              <HugeiconsIcon
                icon={Database02Icon}
                className="w-5 h-5 text-primary"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Connections</h1>
              <p className="text-sm text-muted-foreground">
                Manage your database connections
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="cursor-pointer"
          >
            <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
            Add Connection
          </Button>
        </div>

        {/* Add Connection Form */}
        {showForm && (
          <Card
            className="mb-8 border-border/60 bg-card/70 backdrop-blur-xl"
            style={{ animation: "fade-in 0.3s ease-out" }}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>New Connection</CardTitle>
                  <CardDescription>
                    Connect to a PostgreSQL or MySQL database
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                  className="cursor-pointer"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name & Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="conn-name">Connection Name</Label>
                    <Input
                      id="conn-name"
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="My Production DB"
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Database Type</Label>
                    <div className="flex gap-2">
                      {DB_TYPES.map((t) => (
                        <Button
                          key={t.value}
                          type="button"
                          variant={
                            form.type === t.value ? "default" : "outline"
                          }
                          onClick={() => handleTypeChange(t.value)}
                          className="flex-1 cursor-pointer"
                        >
                          {t.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Host & Port */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="conn-host">Host</Label>
                    <Input
                      id="conn-host"
                      value={form.host}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, host: e.target.value }))
                      }
                      placeholder="localhost"
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="conn-port">Port</Label>
                    <Input
                      id="conn-port"
                      type="number"
                      value={form.port}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          port: Number(e.target.value),
                        }))
                      }
                      required
                      className="bg-background/50"
                    />
                  </div>
                </div>

                <Separator className="bg-border/50" />

                {/* Database, Username, Password */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="conn-database">Database</Label>
                    <Input
                      id="conn-database"
                      value={form.database}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, database: e.target.value }))
                      }
                      placeholder="mydb"
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="conn-username">Username</Label>
                    <Input
                      id="conn-username"
                      value={form.username}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, username: e.target.value }))
                      }
                      placeholder="postgres"
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="conn-password">Password</Label>
                    <Input
                      id="conn-password"
                      type="password"
                      value={form.password}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, password: e.target.value }))
                      }
                      placeholder="••••••••"
                      required
                      className="bg-background/50"
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full cursor-pointer"
                  size="lg"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
                      Create Connection
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Connections List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : connections.length === 0 && !showForm ? (
          <Card
            className="flex flex-col items-center justify-center py-16 border-dashed border-border/60"
            style={{ animation: "fade-in 0.5s ease-out" }}
          >
            <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mb-5">
              <HugeiconsIcon
                icon={ServerStack01Icon}
                className="w-8 h-8 text-muted-foreground"
              />
            </div>
            <h3 className="text-lg font-semibold mb-2">No connections yet</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm text-center">
              Add your first database connection to start asking questions with
              AI.
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="cursor-pointer"
            >
              <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
              Add Your First Connection
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {connections.map((conn) => (
              <Card
                key={conn.id}
                className="flex-row items-center justify-between p-5 py-5 border-border/60 bg-card/70 backdrop-blur-xl transition-all hover:border-primary/30"
                style={{ animation: "fade-in 0.3s ease-out" }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                    <HugeiconsIcon
                      icon={Database02Icon}
                      className="w-5 h-5 text-primary"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">{conn.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {conn.type === "postgres" ? "PostgreSQL" : "MySQL"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {conn.host}:{conn.port}/{conn.database}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {testResults[conn.id] != null && (
                    <Badge
                      variant={
                        testResults[conn.id]?.success
                          ? "default"
                          : "destructive"
                      }
                      className="text-xs"
                    >
                      {testResults[conn.id]?.success
                        ? "✓ Connected"
                        : "✗ Failed"}
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(conn.id)}
                    disabled={testingId === conn.id}
                    className="cursor-pointer"
                  >
                    {testingId === conn.id ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <HugeiconsIcon icon={Plug01Icon} className="w-4 h-4" />
                    )}
                    Test
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push(`/chat?connectionId=${conn.id}`)}
                    className="cursor-pointer"
                  >
                    <HugeiconsIcon icon={BubbleChatIcon} className="w-4 h-4" />
                    Chat
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      className="w-3 h-3"
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(conn.id)}
                    disabled={deletingId === conn.id}
                    className="text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    {deletingId === conn.id ? (
                      <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <HugeiconsIcon icon={Delete02Icon} className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
