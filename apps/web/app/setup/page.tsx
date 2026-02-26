"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  addApiKey,
  getApiKeys,
  activateApiKey,
  deleteApiKey,
  type ApiKeyInfo,
} from "@/lib/api";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Key01Icon,
  ArrowRight01Icon,
  SparklesIcon,
  Shield01Icon,
  Delete02Icon,
  CheckmarkBadge01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SetupPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);

  const loadKeys = useCallback(async () => {
    try {
      const result = await getApiKeys();
      setKeys(result);
    } catch {
      // Ignore
    } finally {
      setLoadingKeys(false);
    }
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !label.trim()) {
      setError("Please enter both a label and API key");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await addApiKey(label.trim(), apiKey.trim());
      setApiKey("");
      setLabel("");
      await loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add API key");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (keyLabel: string) => {
    try {
      await activateApiKey(keyLabel);
      await loadKeys();
    } catch {
      setError("Failed to activate API key");
    }
  };

  const handleDelete = async (keyLabel: string) => {
    try {
      await deleteApiKey(keyLabel);
      await loadKeys();
    } catch {
      setError("Failed to delete API key");
    }
  };

  const hasActiveKey = keys.some((k) => k.active);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div
        className="relative w-full max-w-lg"
        style={{ animation: "fade-in 0.6s ease-out" }}
      >
        {/* Add API Key Card */}
        <Card className="border-border/60 bg-card/70 backdrop-blur-xl p-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                <HugeiconsIcon
                  icon={Key01Icon}
                  className="w-5 h-5 text-primary"
                />
              </div>
              <div>
                <CardTitle className="text-lg">API Keys</CardTitle>
                <CardDescription>
                  Add and manage your Google Gemini API keys
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Existing Keys List */}
            {!loadingKeys && keys.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Stored Keys
                </Label>
                <div className="space-y-2">
                  {keys.map((k) => (
                    <div
                      key={k.label}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        k.active
                          ? "border-primary/40 bg-primary/5"
                          : "border-border/40 bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {k.label}
                            </span>
                            {k.active && (
                              <Badge
                                variant="default"
                                className="text-[10px] px-1.5 py-0"
                              >
                                active
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">
                            {k.masked}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!k.active && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleActivate(k.label)}
                            className="text-muted-foreground hover:text-primary cursor-pointer"
                            title="Activate"
                          >
                            <HugeiconsIcon
                              icon={CheckmarkBadge01Icon}
                              className="w-3.5 h-3.5"
                            />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleDelete(k.label)}
                          className="text-muted-foreground hover:text-destructive cursor-pointer"
                          title="Delete"
                        >
                          <HugeiconsIcon
                            icon={Delete02Icon}
                            className="w-3.5 h-3.5"
                          />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Key Form */}
            <form
              onSubmit={handleAddKey}
              className="space-y-3"
              id="add-key-form"
            >
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Add New Key
              </Label>
              <div className="flex gap-2">
                <Input
                  value={label}
                  onChange={(e) => {
                    setLabel(e.target.value);
                    setError("");
                  }}
                  placeholder="Label (e.g. Personal)"
                  className="h-10 bg-background/50 flex-2"
                />
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setError("");
                  }}
                  placeholder="AIza..."
                  className="h-10 bg-background/50 flex-3"
                />
              </div>
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                variant="secondary"
                disabled={loading || !apiKey.trim() || !label.trim()}
                className="w-full h-9 text-sm cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
                    Add Key
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              onClick={() => router.push("/connections")}
              disabled={!hasActiveKey}
              className="w-full h-11 text-sm font-semibold cursor-pointer"
              size="lg"
            >
              Continue
              <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4" />
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Get your API key from{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
              >
                Google AI Studio
              </a>
            </p>
          </CardFooter>
        </Card>

        {/* Feature highlights */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <Card className="flex-row items-center gap-3 p-4 py-4 border-border/40 bg-card/40">
            <HugeiconsIcon
              icon={SparklesIcon}
              className="w-5 h-5 text-primary shrink-0"
            />
            <p className="text-sm text-muted-foreground">
              Natural language to SQL
            </p>
          </Card>
          <Card className="flex-row items-center gap-3 p-4 py-4 border-border/40 bg-card/40">
            <HugeiconsIcon
              icon={Shield01Icon}
              className="w-5 h-5 text-success shrink-0"
            />
            <p className="text-sm text-muted-foreground">
              Read-only, safe queries
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
