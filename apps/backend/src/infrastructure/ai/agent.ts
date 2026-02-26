import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, type BaseMessage } from "@langchain/core/messages";
import type {
  IAIAgent,
  AgentEvent,
} from "../../domain/interfaces/ai-agent.interface";
import { createExecuteSqlTool } from "./tools";

/**
 * LangGraphAgent — Implements IAIAgent using LangGraph's ReAct agent pattern
 * with Google Gemini as the LLM backbone.
 */
export class LangGraphAgent implements IAIAgent {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async *stream(
    question: string,
    schemaContext: string,
    executeSql: (sql: string) => Promise<Record<string, unknown>[]>,
  ): AsyncIterable<AgentEvent> {
    // Create the LLM
    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      apiKey: this.apiKey,
      temperature: 0,
    });

    // Create the SQL tool with the bound executor
    const sqlTool = createExecuteSqlTool(executeSql);

    // Create the ReAct agent
    const agent = createReactAgent({
      llm,
      tools: [sqlTool],
    });

    // Build the system prompt with schema context
    const systemPrompt = `You are a helpful SQL assistant. You help users query their database using natural language.

## Database Schema
${schemaContext}

## Rules
1. ONLY use SELECT queries — never modify data
2. Always use the execute_sql tool to run queries
3. When showing results, format them clearly
4. If the user's question is ambiguous, make reasonable assumptions and explain them
5. If a query returns no results, explain why and suggest alternatives
6. Keep your explanations concise but informative
7. If you encounter an error, explain what went wrong and try a different approach`;

    // Stream the agent execution
    const stream = await agent.stream(
      {
        messages: [
          new HumanMessage(`${systemPrompt}\n\nUser question: ${question}`),
        ],
      },
      { recursionLimit: 10, streamMode: "updates" },
    );

    for await (const chunk of stream) {
      // e.g. { agent: { messages: [...] } } or { tools: { messages: [...] } }
      const entries = Object.entries(chunk) as [
        string,
        { messages?: BaseMessage[] },
      ][];

      for (const [nodeName, nodeOutput] of entries) {
        const messages = nodeOutput?.messages;
        if (!messages || !Array.isArray(messages)) continue;

        for (const msg of messages) {
          if (nodeName === "agent") {
            // AI model output
            const aiMsg = msg as BaseMessage & {
              tool_calls?: Array<{
                name: string;
                args: Record<string, unknown>;
              }>;
            };

            if (aiMsg.tool_calls && aiMsg.tool_calls.length > 0) {
              // Has tool calls — emit thought + tool_call events
              if (
                aiMsg.content &&
                typeof aiMsg.content === "string" &&
                aiMsg.content.trim()
              ) {
                yield { type: "thought", content: aiMsg.content };
              }
              for (const tc of aiMsg.tool_calls) {
                yield {
                  type: "tool_call",
                  content: JSON.stringify({ name: tc.name, args: tc.args }),
                };
              }
            } else if (aiMsg.content && typeof aiMsg.content === "string") {
              // No tool calls — this is the final answer
              yield { type: "answer", content: aiMsg.content };
            }
          } else if (nodeName === "tools") {
            // Tool execution result
            const content =
              typeof msg.content === "string"
                ? msg.content
                : JSON.stringify(msg.content);
            yield { type: "tool_result", content };
          }
        }
      }
    }
  }
}
