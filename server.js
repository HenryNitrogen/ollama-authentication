// Program: Simple Authenticated Proxy Server (Express + Ollama Chat Bridge)
// Purpose:
// This server exposes a single POST endpoint ("/") that:
// 1) Validates an API key from the Authorization header against an env var.
// 2) Forwards chat requests (model, messages, stream) to a local Ollama server.
// 3) Returns the Ollama response back to the client.
//
// Coding constructs used:
// 1. Module imports (require)
// 2. Environment variable loading (dotenv)
// 3. Express app + middleware (express.json)
// 4. Constant declarations (const)
// 5. Async/await for HTTP requests
// 6. Conditional logic (if)
// 7. HTTP status codes + JSON responses (res.status, res.json)
// 8. Optional chaining (req.body?.model)
//
// Preconditions:
// 1. Node.js runtime supports global fetch (Node 18+) OR a fetch polyfill is installed.
// 2. Environment variable API_KEYS is set to a non-empty string.
// 3. Ollama server is running and reachable at http://localhost:11434/api/chat.
// 4. Client sends JSON body with at least: { model, messages }.
// 5. Client includes correct Authorization header matching API_KEYS.
//
// Postconditions:
// 1. If Authorization fails, client receives 401 with { error: "unauthorized" }.
// 2. If Authorization succeeds, request is proxied and client receives Ollama JSON response.
// 3. Server remains running, listening on the configured port.

const express = require("express");
const dotenv = require("dotenv");

// Input Section
// Loads variables from .env into process.env.
// Why? Keeps secrets (API keys) out of source code.
dotenv.config();

// Input Section
// Reads API_KEYS from environment.
// If missing, default to empty string to force authorization failure.
const API_KEYS = process.env.API_KEYS || "";

// Create Express application instance.
const app = express();

// Input Section
// Port the server listens on.
// Preconditions: port must be free on the host machine.
const port = 3000;

// Middleware Section
// Parses incoming JSON bodies into req.body.
// Why? We expect POST requests with JSON payload.
app.use(express.json());

// Endpoint Section
// Route: POST "/"
// Purpose:
// - Authenticate client via Authorization header.
// - Forward chat payload to Ollama.
// - Return Ollama response.
app.post("/", async (req, res) => {
  // Input Section
  // Extract Authorization header; fallback to empty string if absent.
  const authorization = req.headers.authorization || "";

  // Processing Section (Authentication)
  // Condition: Reject if API_KEYS is missing OR does not match header.
  // Why? Prevents unauthorized access to the proxy.
  if (!API_KEYS || API_KEYS !== authorization) {
    // Output Section (Unauthorized)
    // Postcondition: early return stops further processing.
    return res.status(401).json({ error: "unauthorized" });
  }

  // Input Section (Payload)
  // Extract fields from request body using optional chaining.
  // Why? Avoids crash if body is undefined/null.
  const model = req.body?.model;
  const messages = req.body?.messages;
  const stream = req.body?.stream || false;

  // Processing Section (Proxy Call)
  // Forward request to local Ollama chat endpoint.
  // Preconditions:
  // - "model" should be a valid Ollama model name.
  // - "messages" should be an array of chat messages.
  const response = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Only forwards the three relevant fields.
    body: JSON.stringify({ model, messages, stream }),
  });

  // Processing Section (Response Handling)
  // Parse Ollama response as JSON.
  // Postcondition: If Ollama returns valid JSON, data holds the chat result.
  const data = await response.json();

  // Output Section (Success)
  // Return Ollama's JSON directly to the client.
  return res.json(data);
});

// Server Start Section
// Begin listening on the specified port.
// Postcondition: Server is running and ready for requests.
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// End of Program

/* 
Notes on efficiency & elegance:
- Efficient because it does minimal work: a single auth check + a single proxy call.
- Elegant because the flow is linear: validate → forward → return.
- For more robustness, you could add:
  1) try/catch around fetch and response.json()
  2) validation for model/messages types
  3) support for streaming responses if stream=true
*/
