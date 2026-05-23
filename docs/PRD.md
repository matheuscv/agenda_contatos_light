# PRD — Agenda de Contatos Light

## 1. Visão Geral

Aplicação web de página única para gerenciamento de contatos. Toda a persistência e lógica de dados é delegada a um servidor MCP externo (`https://contatos-mcp.onrender.com`). A aplicação funciona como uma interface visual leve sobre as tools desse MCP.

**Objetivo**: fornecer uma UI limpa e funcional (listar, criar, editar, excluir contatos) sem duplicar lógica de negócio — apenas expondo o que o MCP já oferece.

---

## 2. Requisitos Funcionais

| # | Funcionalidade | Descrição |
|---|---------------|-----------|
| F1 | Listar contatos | Exibir todos os contatos em um datagrid ao carregar a página |
| F2 | Criar contato | Botão "+ Novo Contato" abre modal com formulário em branco |
| F3 | Editar contato | Botão "Editar" em cada linha abre modal pré-preenchido |
| F4 | Excluir contato | Botão "Excluir" em cada linha exibe confirmação e remove o contato |

### Schema do Contato

| Campo    | Tipo   | Obrigatório |
|----------|--------|-------------|
| nome     | string | sim |
| email    | string | sim |
| empresa  | string | não |
| data     | date   | não |
| telefone | string | não |

---

## 3. Requisitos Não Funcionais

- **Leveza**: sem backend proprietário; toda a lógica de dados vive no MCP externo.
- **Deploy simples**: uma única implantação na Vercel — sem serviços adicionais no Render.
- **Sem autenticação de usuário**: a aplicação é aberta; não há controle de acesso ou roles.
- **Sem paginação server-side** (MVP): todos os contatos são carregados de uma vez e filtrados no client.

---

## 4. Arquitetura

```
┌─────────────────────────────────┐
│         Browser                 │
│   React + shadcn/ui + TanStack  │
│   ContactsTable  ContactDialog  │
└──────────────┬──────────────────┘
               │ fetch (REST)
┌──────────────▼──────────────────┐
│     Next.js API Routes          │
│     (Vercel serverless)         │
│                                 │
│  GET    /api/contacts           │
│  POST   /api/contacts           │
│  PUT    /api/contacts/:id       │
│  DELETE /api/contacts/:id       │
└──────────────┬──────────────────┘
               │ @modelcontextprotocol/sdk
┌──────────────▼──────────────────┐
│  MCP Server (Render)            │
│  https://contatos-mcp.onrender.com │
│                                 │
│  tool: list_contacts            │
│  tool: create_contact           │
│  tool: update_contact           │
│  tool: delete_contact           │
└─────────────────────────────────┘
```

### Por que API Routes e não chamada direta ao MCP?

Servidores MCP usam transporte SSE/HTTP com protocolo proprietário. O browser não consegue chamar diretamente (CORS + protocolo). As API Routes do Next.js resolvem isso e mantêm o token de auth fora do client.

---

## 5. Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Framework | Next.js 15 (App Router) | Deploy nativo na Vercel; API Routes embutidas |
| UI Components | shadcn/ui | Componentes acessíveis, sem lock-in, Tailwind-first |
| DataGrid | TanStack Table v8 | Headless, leve, flexível |
| Formulários | react-hook-form + zod | Validação typesafe, mínimo boilerplate |
| Cliente MCP | @modelcontextprotocol/sdk | SDK oficial; suporte a SSE e Streamable HTTP |
| Estilo | Tailwind CSS | Incluído no shadcn/ui setup |
| Deploy | Vercel | Zero-config para Next.js |

---

## 6. Estrutura de Arquivos

```
agenda-contatos-light/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Monta ContactsTable, busca inicial
│   └── api/
│       └── contacts/
│           ├── route.ts            # GET (listar) + POST (criar)
│           └── [id]/
│               └── route.ts        # PUT (editar) + DELETE (excluir)
├── components/
│   ├── contacts-table.tsx          # DataGrid: colunas, filtro, botões de ação
│   └── contact-dialog.tsx          # Modal reutilizável Add/Edit
├── lib/
│   └── mcp.ts                      # Factory de cliente MCP + função callTool()
├── .env.local                      # MCP_SERVER_URL, MCP_API_KEY (não commitado)
├── CLAUDE.md
└── PRD.md
```

---

## 7. Detalhamento dos Componentes

### `lib/mcp.ts`
- Instancia `Client` do SDK com `SSEClientTransport`
- Injeta `MCP_API_KEY` no header de autenticação
- Exporta `callTool(name: string, args: object)` → conecta, invoca, fecha conexão

### `app/api/contacts/route.ts`
- `GET` → `callTool("list_contacts", {})` → retorna array JSON
- `POST` → valida body → `callTool("create_contact", body)` → retorna contato criado

### `app/api/contacts/[id]/route.ts`
- `PUT` → `callTool("update_contact", { id, ...body })` → retorna contato atualizado
- `DELETE` → `callTool("delete_contact", { id })` → retorna 204

### `components/contacts-table.tsx`
- Colunas: Nome, Email, Empresa, Data, Telefone, Ações
- Input de busca client-side (filtra por nome/email)
- Botão "+ Novo Contato" no header da tabela
- Coluna Ações: `<Button>Editar</Button>` + `<Button variant="destructive">Excluir</Button>`
- Excluir exibe `<AlertDialog>` de confirmação antes de chamar DELETE

### `components/contact-dialog.tsx`
- `<Dialog>` do shadcn/ui controlado por prop `open`
- Props: `mode: "create" | "edit"`, `contact?: Contact`, `onSuccess: () => void`
- Formulário com react-hook-form + zod schema
- Submit → POST ou PUT → fecha dialog → chama `onSuccess` (refetch lista)

---

## 8. Fluxo de Dados

```
1. page.tsx renderiza → useEffect → GET /api/contacts
2. ContactsTable recebe contacts[] e renderiza linhas
3. [Criar] clique em "+ Novo" → ContactDialog(mode="create") abre
         → submit → POST /api/contacts → onSuccess → refetch
4. [Editar] clique em "Editar" → ContactDialog(mode="edit", contact=row) abre
         → submit → PUT /api/contacts/:id → onSuccess → refetch
5. [Excluir] clique em "Excluir" → AlertDialog confirma
         → DELETE /api/contacts/:id → refetch
```

---

## 9. Configuração de Ambiente

### Desenvolvimento local
```env
# .env.local (nunca commitar)
MCP_SERVER_URL=https://contatos-mcp.onrender.com
MCP_API_KEY=<token_fornecido>
```

### Produção (Vercel)
Configurar as mesmas variáveis no painel **Settings → Environment Variables** do projeto na Vercel.

---

## 10. Critérios de Aceitação

- [ ] Datagrid exibe contatos reais retornados pelo MCP
- [ ] Filtro de busca funciona client-side (por nome ou email)
- [ ] Modal de criação valida campos obrigatórios antes de submeter
- [ ] Editar pré-preenche o formulário com dados atuais do contato
- [ ] Excluir exibe confirmação e remove da lista após sucesso
- [ ] Build sem erros de TypeScript (`npm run build`)
- [ ] Deploy na Vercel funcionando com env vars de produção

---

## 11. Fora de Escopo (MVP)

- Autenticação de usuário / roles
- Paginação server-side
- Ordenação persistida
- Exportação de dados (CSV, etc.)
- Histórico de alterações
