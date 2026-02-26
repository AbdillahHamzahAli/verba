"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveApiKey } from "@/lib/api";
import { KeyRound, ArrowRight, Database, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError("Please enter your API key");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await saveApiKey(apiKey);
      router.push("/connections");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save API key");
    } finally {
      setLoading(false);
    }
  };

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
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 mb-6"
            style={{ animation: "pulse-glow 3s ease-in-out infinite" }}
          >
            <Database className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Welcome to Verba
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Your self-hosted AI SQL Agent.
            <br />
            Connect your databases, ask questions in natural language.
          </p>
        </div>

        {/* Setup Card */}
        <Card className="border-border/60 bg-card/70 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                <KeyRound className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Connect your AI</CardTitle>
                <CardDescription>
                  Enter your Google Gemini API key to get started
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5" id="setup-form">
              <div className="space-y-2">
                <Label htmlFor="api-key">Gemini API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setError("");
                  }}
                  placeholder="AIza..."
                  className="h-11 bg-background/50"
                />
                {error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              form="setup-form"
              disabled={loading || !apiKey.trim()}
              className="w-full h-11 text-sm font-semibold cursor-pointer"
              size="lg"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
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
            <Sparkles className="w-5 h-5 text-primary shrink-0" />
            <p className="text-sm text-muted-foreground">
              Natural language to SQL
            </p>
          </Card>
          <Card className="flex-row items-center gap-3 p-4 py-4 border-border/40 bg-card/40">
            <Shield className="w-5 h-5 text-success shrink-0" />
            <p className="text-sm text-muted-foreground">
              Read-only, safe queries
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
