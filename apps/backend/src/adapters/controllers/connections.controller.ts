import { Router } from "express";
import type { CreateConnectionUseCase } from "../../use-cases/connections/create-connection.use-case";
import type { ListConnectionsUseCase } from "../../use-cases/connections/list-connections.use-case";
import type { DeleteConnectionUseCase } from "../../use-cases/connections/delete-connection.use-case";
import type { TestConnectionUseCase } from "../../use-cases/connections/test-connection.use-case";

export function createConnectionsController(
  createConnection: CreateConnectionUseCase,
  listConnections: ListConnectionsUseCase,
  deleteConnection: DeleteConnectionUseCase,
  testConnection: TestConnectionUseCase,
): Router {
  const router = Router();

  // POST /api/connections
  router.post("/", async (req, res) => {
    try {
      const { name, type, host, port, database, username, password } = req.body;

      if (
        !name ||
        !type ||
        !host ||
        !port ||
        !database ||
        !username ||
        !password
      ) {
        res.status(400).json({ error: "All fields are required" });
        return;
      }

      if (!["postgres", "mysql"].includes(type)) {
        res.status(400).json({ error: "Type must be 'postgres' or 'mysql'" });
        return;
      }

      const dataSource = await createConnection.execute({
        name,
        type,
        host,
        port: Number(port),
        database,
        username,
        password,
      });

      // Don't return the password in the response
      const { password: _, ...response } = dataSource;
      res.status(201).json(response);
    } catch (error) {
      console.error("Error creating connection:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/connections
  router.get("/", async (_req, res) => {
    try {
      const connections = await listConnections.execute();
      res.json(connections);
    } catch (error) {
      console.error("Error listing connections:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // DELETE /api/connections/:id
  router.delete("/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: "Invalid ID" });
        return;
      }

      const deleted = await deleteConnection.execute(id);
      if (!deleted) {
        res.status(404).json({ error: "Connection not found" });
        return;
      }

      res.json({ success: true, message: "Connection deleted" });
    } catch (error) {
      console.error("Error deleting connection:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // POST /api/connections/:id/test
  router.post("/:id/test", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: "Invalid ID" });
        return;
      }

      const result = await testConnection.execute(id);
      if (!result.success) {
        res.status(422).json({ success: false, error: result.error });
        return;
      }

      res.json({ success: true, message: "Connection successful" });
    } catch (error) {
      console.error("Error testing connection:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
