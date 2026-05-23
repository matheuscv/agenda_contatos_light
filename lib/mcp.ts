import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const MCP_URL = process.env.MCP_SERVER_URL!;
const MCP_KEY = process.env.MCP_API_KEY!;

const authHeaders = { Authorization: `Bearer ${MCP_KEY}` };

async function createClient(): Promise<Client> {
  const client = new Client({ name: "agenda-contatos", version: "1.0.0" });

  // Tenta Streamable HTTP primeiro (mais eficiente para serverless)
  try {
    const transport = new StreamableHTTPClientTransport(
      new URL(`${MCP_URL}/mcp`),
      { requestInit: { headers: authHeaders } }
    );
    await client.connect(transport);
    return client;
  } catch {
    // Fallback para SSE (transporte legado)
  }

  const transport = new SSEClientTransport(new URL(`${MCP_URL}/sse`), {
    eventSourceInit: { headers: authHeaders } as EventSourceInit,
    requestInit: { headers: authHeaders },
  });
  await client.connect(transport);
  return client;
}

export async function listTools() {
  const client = await createClient();
  try {
    return await client.listTools();
  } finally {
    await client.close();
  }
}

export async function callTool(
  name: string,
  args: Record<string, unknown> = {}
) {
  const client = await createClient();
  try {
    const result = await client.callTool({ name, arguments: args });

    if (result.isError) {
      throw new Error(
        (result.content as Array<{ text?: string }>)
          .map((c) => c.text)
          .join("")
      );
    }

    const items = (result.content as Array<{ text?: string }>)
      .map((c) => c.text ?? "")
      .filter((t) => t.trim());

    if (items.length === 0) return null;

    // Tenta parsear o texto completo (caso comum: um único bloco JSON)
    const joined = items.join("");
    try {
      return JSON.parse(joined);
    } catch {}

    // Múltiplos itens concatenados (ex: listar_contatos retorna um objeto por item)
    const parsed = items.map((t) => {
      try {
        return JSON.parse(t);
      } catch {
        return t;
      }
    });
    return parsed.length === 1 ? parsed[0] : parsed;
  } finally {
    await client.close();
  }
}
