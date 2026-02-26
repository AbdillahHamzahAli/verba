import { Router } from "express";
import type { AskQuestionUseCase } from "../../use-cases/chat/ask-question.use-case";

/**
 * ChatController — SSE streaming endpoint for AI chat.
 *
 * POST /api/chat
 * Body: { connectionId: number, question: string }
 *
 * Streams Server-Sent Events with types: thought, tool_call, tool_result, answer, error
 */
export function createChatController(askQuestion: AskQuestionUseCase): Router {
  const router = Router();

  router.post("/", async (req, res) => {
    const { connectionId, question } = req.body;

    if (!connectionId || !question) {
      res.status(400).json({
        error: "connectionId and question are required",
      });
      return;
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
    res.flushHeaders();

    try {
      const stream = askQuestion.execute(Number(connectionId), question);

      for await (const event of stream) {
        // Format as SSE: event: <type>\ndata: <json>\n\n
        res.write(`event: ${event.type}\n`);
        res.write(`data: ${JSON.stringify({ content: event.content })}\n\n`);
      }

      // Signal completion
      res.write(`event: done\ndata: {}\n\n`);
      res.end();
    } catch (error) {
      console.error("Chat stream error:", error);
      res.write(
        `event: error\ndata: ${JSON.stringify({ content: "Internal server error" })}\n\n`,
      );
      res.end();
    }
  });

  return router;
}
