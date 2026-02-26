# PROJECT CONTEXT

You are an expert Full-Stack AI Engineer. We are building a project named "Verba".
Verba is a self-hosted, Universal AI SQL Agent and Database Management Tool. It acts as a smart middleware: users connect their external databases (PostgreSQL, MySQL, etc.), and instead of writing SQL, they ask questions in natural language. The AI translates the question into the correct SQL dialect, executes it safely, and returns the data in a rich UI table.

# GOALS

1. Create a Monolith Container architecture: A Next.js frontend and a Bun backend, deployable as a single Docker container or via an npm package.
2. Zero-config startup: No environment variables required for API keys. The app must have a setup UI on first load to save the LLM API Key into a local SQLite database.
3. Robust AI Tool Calling: Use LangGraph to ensure the AI can execute SQL, catch errors (e.g., wrong column name), and auto-correct itself before returning the final answer to the user.

# TECH STACK

- **Runtime:** Bun (strictly Bun, avoid Node.js specific APIs if Bun has a native faster alternative).
- **Frontend:** Next.js (App Router, Tailwind CSS, Shadcn UI). MUST be configured as `output: 'export'` (Static HTML/SPA).
- **Backend Framework:** Express.js (running on Bun) to serve the Next.js static files and handle `/api` routes.
- **System Database (Internal):** `bun:sqlite` with **Drizzle ORM**. Used strictly for storing user settings (Gemini API Key) and target database connection credentials (encrypted).
- **Target Database Adapter:** **TypeORM** and `pg`/`mysql2`. Used STRICTLY for dynamic runtime connections to external user databases to perform schema introspection (`.getTables()`) and raw SQL execution. Do NOT use TypeORM for the internal System DB.
- **AI Orchestration:** `@langchain/google-genai` (Gemini 1.5 Flash) and `@langchain/langgraph` (`createReactAgent`).

# STRICT RULES & CONSTRAINTS

1. **Architecture Separation:** The Next.js app must be completely decoupled from the backend logic during development. The backend Express server will serve the Next.js `out` directory in production. Do not use Next.js API routes (`app/api`); use Express for all backend logic.
2. **Dynamic Connections:** The backend must be able to open a TypeORM connection using credentials from the SQLite DB, execute a query, and DESTROY the connection immediately to prevent memory leaks.
3. **AI Execution Flow:** The LangGraph agent must use an `execute_sql` tool. The System Prompt must strictly enforce read-only queries (SELECT only) and mandate a `LIMIT 50` unless specified otherwise.
4. **Security:** Target database passwords must be encrypted using `crypto-js` (AES) before saving to SQLite and decrypted in-memory right before connecting.
5. **UI/UX:** The chat interface must parse the LangGraph stream to separate the AI's "thought process/schema analysis", the "generated SQL code block", and the "final data table".

# EXECUTION STEPS

1. Initialize the Bun backend project and setup the SQLite + Drizzle schema (Tables: `system_settings`, `data_sources`).
2. Create the Express server that handles the setup endpoints (check if API key exists, save API key).
3. Initialize the Next.js frontend, configure static export, and build the Setup/Welcome screen.
4. Implement the Dynamic Connection Manager using TypeORM and LangChain's `SqlDatabase` utility.
5. Build the LangGraph ReAct Agent with the `execute_sql` tool.
6. Create the Chat UI to handle streaming responses and render tables.
7. Generate the final multi-stage `Dockerfile`.

Please acknowledge these instructions. If you understand, begin with Step 1 by creating the project structure and the Drizzle schema for the System DB.
