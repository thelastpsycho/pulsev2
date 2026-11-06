import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const API_BASE_URL = process.env.PULSE_MCP_API_BASE_URL;
const SERVICE_EMAIL = process.env.PULSE_MCP_EMAIL;
const SERVICE_PASSWORD = process.env.PULSE_MCP_PASSWORD;
const ACCESS_KEY = process.env.MCP_ACCESS_KEY;

let cachedToken = null;

async function login() {
  const res = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: SERVICE_EMAIL,
      password: SERVICE_PASSWORD,
      device_name: "mcp-server",
    }),
  });
  if (!res.ok) {
    throw new Error(`Pulse login failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  cachedToken = data.token;
  return cachedToken;
}

async function pulseTool(name, body) {
  if (!cachedToken) await login();

  const call = (token) =>
    fetch(`${API_BASE_URL}/ai/tools/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

  let res = await call(cachedToken);
  if (res.status === 401) {
    res = await call(await login());
  }
  if (!res.ok) {
    throw new Error(`Pulse API error (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

function buildServer() {
  const server = new McpServer({ name: "guestpulse", version: "1.0.0" });

  server.tool(
    "summary",
    "Summary of GuestPulse issues for a period: counts, trends, top items.",
    {
      period: z.string().optional().describe("e.g. last_week, last_month, today"),
      start_date: z.string().optional(),
      end_date: z.string().optional(),
      limit: z.number().optional(),
    },
    async (args) => ({
      content: [{ type: "text", text: JSON.stringify(await pulseTool("summary", args)) }],
    }),
  );

  server.tool(
    "room-search",
    "Find issues related to a specific hotel room number.",
    {
      room_number: z.string(),
      limit: z.number().optional(),
    },
    async (args) => ({
      content: [{ type: "text", text: JSON.stringify(await pulseTool("room-search", args)) }],
    }),
  );

  server.tool(
    "guest-search",
    "Find issues related to a guest by name.",
    {
      guest_name: z.string(),
      limit: z.number().optional(),
    },
    async (args) => ({
      content: [{ type: "text", text: JSON.stringify(await pulseTool("guest-search", args)) }],
    }),
  );

  server.tool(
    "department-stats",
    "Open/closed issue counts per department.",
    {
      period: z.string().optional(),
    },
    async (args) => ({
      content: [{ type: "text", text: JSON.stringify(await pulseTool("department-stats", args)) }],
    }),
  );

  server.tool(
    "urgent-issues",
    "List the most urgent open issues.",
    {
      limit: z.number().optional(),
    },
    async (args) => ({
      content: [{ type: "text", text: JSON.stringify(await pulseTool("urgent-issues", args)) }],
    }),
  );

  return server;
}

export default async function handler(req, res) {
  if (!ACCESS_KEY || req.query.key !== ACCESS_KEY) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain");
    res.end("Not found");
    return;
  }

  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  res.on("close", () => {
    transport.close();
    server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}
