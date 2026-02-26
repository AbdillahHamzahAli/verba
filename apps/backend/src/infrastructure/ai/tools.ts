import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Creates a LangChain tool that executes SQL queries against an external database.
 *
 * Security constraints:
 * - Only SELECT queries allowed (read-only)
 * - Auto-appends LIMIT 50 if no limit is present
 *
 * @param executeSql - Callback that runs SQL against the active connection
 */
export function createExecuteSqlTool(
  executeSql: (sql: string) => Promise<Record<string, unknown>[]>,
) {
  return tool(
    async ({ sql }: { sql: string }): Promise<string> => {
      // Security: Only allow SELECT statements
      const trimmed = sql.trim();
      const upperSql = trimmed.toUpperCase();

      if (!upperSql.startsWith("SELECT")) {
        return JSON.stringify({
          error:
            "Only SELECT queries are allowed. Do not use INSERT, UPDATE, DELETE, DROP, ALTER, or any other modifying statement.",
        });
      }

      // Block dangerous keywords
      const dangerousKeywords = [
        "INSERT",
        "UPDATE",
        "DELETE",
        "DROP",
        "ALTER",
        "TRUNCATE",
        "CREATE",
        "GRANT",
        "REVOKE",
      ];
      for (const keyword of dangerousKeywords) {
        if (upperSql.startsWith(keyword)) {
          return JSON.stringify({
            error: `Dangerous operation detected: ${keyword}. Only SELECT queries are allowed.`,
          });
        }
      }

      // Auto-append LIMIT 50 if not present
      let finalSql = trimmed;
      if (!upperSql.includes("LIMIT")) {
        finalSql = finalSql.replace(/;\s*$/, "");
        finalSql += " LIMIT 50";
      }

      try {
        const rows = await executeSql(finalSql);
        return JSON.stringify({
          columns: rows.length > 0 ? Object.keys(rows[0]!) : [],
          rows,
          rowCount: rows.length,
        });
      } catch (err) {
        return JSON.stringify({
          error:
            err instanceof Error ? err.message : "Failed to execute SQL query",
        });
      }
    },
    {
      name: "execute_sql",
      description:
        "Execute a read-only SQL SELECT query against the connected database. " +
        "Use this to retrieve data. Only SELECT statements are allowed. " +
        "Results are limited to 50 rows maximum.",
      schema: z.object({
        sql: z
          .string()
          .describe(
            "The SQL SELECT query to execute. Must be a valid SELECT statement.",
          ),
      }),
    },
  );
}
