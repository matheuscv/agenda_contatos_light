# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Contexto do Projeto

Agenda de contatos com uma única página. Toda persistência vive em um **servidor MCP externo** (`https://contatos-mcp.onrender.com`) — esta aplicação é apenas uma UI sobre as tools desse MCP. Não há banco de dados próprio.

## Comandos

```bash
npm run dev      # desenvolvimento em http://localhost:3000
npm run build    # build de produção (valida TypeScript)
npm run lint     # ESLint
```

## Variáveis de Ambiente

```env
MCP_SERVER_URL=https://contatos-mcp.onrender.com
MCP_API_KEY=<token>
```

Ambas são obrigatórias. Sem `MCP_API_KEY` o servidor retorna 401. Nunca expor no client — usadas somente nas API Routes (servidor).

## Arquitetura: Por que API Routes e não chamada direta ao MCP?

O browser não consegue chamar o MCP diretamente: o protocolo usa SSE/HTTP com handshake proprietário e o servidor exige auth. As **Next.js API Routes** funcionam como proxy server-side:

```
Browser  →  /api/contacts (Next.js, server)  →  callTool()  →  MCP externo
```

Isso mantém o `MCP_API_KEY` fora do bundle do client e resolve o problema de CORS.

## Camada MCP (`lib/mcp.ts`)

Ponto central da integração. Exporta `callTool(name, args)` que:
1. Instancia `Client` do `@modelcontextprotocol/sdk` com `SSEClientTransport`
2. Injeta `MCP_API_KEY` no header de autenticação
3. Conecta, invoca a tool, fecha a conexão

Cada API Route chama `callTool()` de forma independente (sem conexão persistente) — compatível com o modelo serverless da Vercel.

## Nomes das Tools MCP

Os nomes reais foram descobertos via `client.listTools()` durante a Fase 2 da implementação. Ver `PLANO_EXECUCAO.md` § Fase 2 para o registro. As API Routes mapeiam para estas tools:

| Rota | Tool MCP |
|------|----------|
| `GET /api/contacts` | `listar_contatos` |
| `POST /api/contacts` | `criar_contato` |
| `PUT /api/contacts/[id]` | `atualizar_contato` |
| `DELETE /api/contacts/[id]` | `excluir_contato` |

> Se o MCP for atualizado e os nomes mudarem, atualizar `lib/mcp.ts` e esta tabela.

## Componentes Principais

- **`ContactsTable`** — recebe `Contact[]` como prop, gerencia estado de dialog/delete internamente via callbacks para `page.tsx`
- **`ContactDialog`** — modal único para criar e editar; prop `mode: "create" | "edit"` controla o comportamento e qual API Route chamar
- **`page.tsx`** — único ponto de `fetch` e estado global da lista; passa `onSuccess` para `ContactDialog` que dispara refetch

## Referências

- `docs/PRD.md` — requisitos funcionais, critérios de aceitação e o que está fora do escopo
- `docs/PLANO_EXECUCAO.md` — fases de implementação com checkboxes de progresso
