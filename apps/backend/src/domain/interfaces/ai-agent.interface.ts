export interface AgentEvent {
  type: "thought" | "tool_call" | "tool_result" | "answer" | "error";
  content: string;
}

export interface IAIAgent {
  stream(
    question: string,
    schemaContext: string,
    executeSql: (sql: string) => Promise<Record<string, unknown>[]>,
  ): AsyncIterable<AgentEvent>;
}
