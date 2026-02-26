"use client";

import { useState } from "react";
import type { ChatEvent } from "@/lib/api";
import { DataTable } from "./data-table";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiBrain01Icon,
  Database02Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";

interface ChatMessageProps {
  event: ChatEvent;
}

/**
 * ChatMessage — renders a single agent event in the chat stream.
 * Handles thought, tool_call, tool_result, answer, and error types.
 */
export function ChatMessage({ event }: ChatMessageProps) {
  const [expanded, setExpanded] = useState(false);

  switch (event.type) {
    case "thought":
      return (
        <div className="flex gap-3 py-2 animate-in fade-in duration-300">
          <div className="flex items-start pt-0.5">
            <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
              <HugeiconsIcon
                icon={AiBrain01Icon}
                className="w-3.5 h-3.5 text-muted-foreground"
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium mb-1">
              Thinking...
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {event.content}
            </p>
          </div>
        </div>
      );

    case "tool_call": {
      let parsed: { name?: string; args?: { sql?: string } } = {};
      try {
        parsed = JSON.parse(event.content);
      } catch {
        /* ignore */
      }
      const sql = parsed?.args?.sql || event.content;
      return (
        <div className="flex gap-3 py-2 animate-in fade-in duration-300">
          <div className="flex items-start pt-0.5">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
              <HugeiconsIcon
                icon={Database02Icon}
                className="w-3.5 h-3.5 text-primary"
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs">
                SQL Query
              </Badge>
            </div>
            <pre className="text-sm bg-muted/50 border border-border/40 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap">
              {sql}
            </pre>
          </div>
        </div>
      );
    }

    case "tool_result": {
      let parsed: {
        columns?: string[];
        rows?: Record<string, unknown>[];
        rowCount?: number;
        error?: string;
      } = {};
      try {
        parsed = JSON.parse(event.content);
      } catch {
        /* ignore */
      }

      if (parsed.error) {
        return (
          <div className="flex gap-3 py-2 animate-in fade-in duration-300">
            <div className="w-6 h-6" />
            <div className="flex-1 min-w-0">
              <Badge variant="destructive" className="text-xs mb-2">
                Query Error
              </Badge>
              <p className="text-sm text-destructive">{parsed.error}</p>
            </div>
          </div>
        );
      }

      if (parsed.columns && parsed.rows) {
        return (
          <div className="flex gap-3 py-2 animate-in fade-in duration-300">
            <div className="w-6 h-6" />
            <div className="flex-1 min-w-0">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 mb-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Badge variant="outline" className="text-xs">
                  {parsed.rowCount} row{parsed.rowCount !== 1 ? "s" : ""}
                </Badge>
                <span>{expanded ? "Hide" : "Show"} results</span>
              </button>
              {expanded && (
                <DataTable columns={parsed.columns} rows={parsed.rows} />
              )}
            </div>
          </div>
        );
      }

      return null;
    }

    case "answer":
      return (
        <div className="flex gap-3 py-3 animate-in fade-in duration-300">
          <div className="flex items-start pt-0.5">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
              <HugeiconsIcon
                icon={AiBrain01Icon}
                className="w-4 h-4 text-primary"
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
              {event.content}
            </div>
          </div>
        </div>
      );

    case "error":
      return (
        <div className="flex gap-3 py-2 animate-in fade-in duration-300">
          <div className="flex items-start pt-0.5">
            <div className="w-6 h-6 rounded-md bg-destructive/10 flex items-center justify-center">
              <HugeiconsIcon
                icon={AlertCircleIcon}
                className="w-3.5 h-3.5 text-destructive"
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-destructive">{event.content}</p>
          </div>
        </div>
      );

    default:
      return null;
  }
}
