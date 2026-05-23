# Plano de Execução — Agenda de Contatos Light

> Documento de controle de implementação. Cada fase deve ser concluída e validada antes de iniciar a próxima.
> Status: `[ ]` pendente | `[x]` concluído | `[~]` em andamento

---

## Fase 1 — Scaffold do Projeto Next.js ✅

**Objetivo**: ter o projeto Next.js 16 rodando localmente com shadcn/ui configurado.

### Tarefas

- [x] 1.1 Inicializar projeto Next.js 16 com TypeScript e App Router
- [x] 1.2 Instalar e inicializar shadcn/ui (v4, Tailwind v4)
- [x] 1.3 Adicionar componentes shadcn/ui: table, button, dialog, input, label, alert-dialog, sonner
       > Nota: `form` não existe no registry shadcn v4 — usar react-hook-form + Input/Label diretamente
- [x] 1.4 Instalar dependências: react-hook-form, zod, @hookform/resolvers, @tanstack/react-table, @modelcontextprotocol/sdk
- [x] 1.5 Criar `.env.local` com MCP_SERVER_URL e MCP_API_KEY
- [x] 1.6 Limpar boilerplate (page.tsx, metadata do layout, Toaster adicionado ao layout)

### Critério de conclusão
`npm run build` sem erros — ✅ concluído.

---

## Fase 2 — Camada de Integração MCP

**Objetivo**: ter uma função `callTool()` funcional que se comunica com o MCP externo, com os nomes reais das tools mapeados.

### Tarefas

- [x] 2.1 Instalar dependência do SDK MCP
  ```bash
  npm install @modelcontextprotocol/sdk
  ```
- [x] 2.2 Criar `lib/mcp.ts` — factory do cliente com autenticação
  - Instanciar `Client` com `SSEClientTransport` (com fallback de `StreamableHTTPClientTransport`)
  - Injetar `MCP_API_KEY` no header
  - Exportar `callTool(name, args)` → conecta, invoca, fecha
  - Nota: `listar_contatos` retorna cada contato como item separado no `content[]` — `callTool` lida com múltiplos itens
- [x] 2.3 Criar script/rota temporária de descoberta para listar as tools disponíveis
  - `GET /api/mcp-info` → chama `client.listTools()` e retorna JSON
- [x] 2.4 Documentar as tools descobertas (nomes, parâmetros, retorno)

> **Nomes reais confirmados via `client.listTools()`:**
> | Ação | Tool MCP |
> |------|----------|
> | Listar | `listar_contatos` |
> | Criar | `criar_contato` |
> | Editar | `atualizar_contato` |
> | Excluir | `excluir_contato` |
>
> Parâmetros de `criar_contato` / `atualizar_contato`: `nome`, `email`, `telefone`, `empresa`, `observacoes` (+ `id` no update)

- [x] 2.5 Criar `app/api/contacts/route.ts`
  - `GET` → `callTool("listar_contatos", {})` → retorna `Contact[]`
  - `POST` → valida body → `callTool("criar_contato", body)` → retorna contato criado
- [x] 2.6 Criar `app/api/contacts/[id]/route.ts`
  - `PUT` → `callTool("atualizar_contato", { id, ...body })`
  - `DELETE` → `callTool("excluir_contato", { id })`
- [x] 2.7 Remover rota temporária de descoberta (`/api/mcp-info`)

### Critério de conclusão
`GET http://localhost:3000/api/contacts` retorna array com contatos reais do MCP.

---

## Fase 3 — Componente ContactsTable

**Objetivo**: datagrid funcional exibindo os contatos com filtro e botões de ação.

### Tarefas

- [x] 3.1 Definir tipo TypeScript `Contact` em `lib/types.ts`
  ```ts
  type Contact = {
    id: string
    nome: string
    email: string
    empresa?: string
    data?: string
    telefone?: string
  }
  ```
- [x] 3.2 Criar `components/contacts-table.tsx`
  - Definir colunas: Nome, Email, Empresa, Data, Telefone, Ações
  - Coluna Ações: botões **Editar** e **Excluir** por linha
  - Input de busca client-side (filtra por nome e email via TanStack)
  - Botão "+ Novo Contato" no header da tabela
  - Estado de loading enquanto carrega dados
  - Estado vazio quando não há contatos
- [x] 3.3 Instalar TanStack Table (se não incluído pelo shadcn)
- [x] 3.4 Integrar `ContactsTable` em `app/page.tsx`
  - `useEffect` → `fetch("/api/contacts")` → passa dados para a tabela

### Critério de conclusão
Página exibe o datagrid com contatos reais, filtro funcional e botões visíveis em cada linha.

---

## Fase 4 — Componente ContactDialog (Criar e Editar)

**Objetivo**: modal funcional para criação e edição de contatos com validação.

### Tarefas

- [x] 4.1 Instalar dependências de formulário
- [x] 4.2 Criar `components/contact-dialog.tsx`
  - Props: `mode: "create" | "edit"`, `contact?: Contact`, `open: boolean`, `onOpenChange`, `onSuccess`
  - Campos: Nome, Email, Empresa, Telefone, Observações
  - Validação com zod (nome e email obrigatórios)
  - Submit:
    - `mode="create"` → `POST /api/contacts`
    - `mode="edit"` → `PUT /api/contacts/:id`
  - Fecha o dialog e chama `onSuccess()` após resposta de sucesso
  - Exibe estado de loading no botão durante o submit ("Salvando...")
  - Exibe erro de servidor abaixo do formulário quando a chamada falha
- [x] 4.3 Conectar ContactDialog ao ContactsTable
  - Estado `dialogState: { open, mode, contact? }` em `page.tsx`
  - Botão "+ Novo" → abre em `mode="create"`
  - Botão "Editar" → abre em `mode="edit"` com dados da linha
  - `onSuccess` → refetch da lista

### Critério de conclusão
Criar e editar contatos via modal, com validação, sem erros no console. Lista atualiza após submit.

---

## Fase 5 — Ação de Excluir

**Objetivo**: exclusão com confirmação via AlertDialog.

### Tarefas

- [x] 5.1 Adicionar `AlertDialog` de confirmação ao `ContactsTable`
  - Dispara ao clicar em "Excluir"
  - Exibe: "Tem certeza que deseja excluir **{nome}**? Esta ação não pode ser desfeita."
  - Botões: Cancelar / Excluir (vermelho)
- [x] 5.2 Conectar confirmação ao `DELETE /api/contacts/:id`
  - Estado de loading no botão durante a chamada ("Excluindo...")
  - Refetch da lista após sucesso
  - Toast de erro via sonner caso a exclusão falhe

### Critério de conclusão
Excluir contato exibe confirmação, remove da lista e atualiza o datagrid.

---

## Fase 6 — Polish e Tratamento de Erros

**Objetivo**: UX consistente com feedback visual em todos os cenários.

### Tarefas

- [x] 6.1 Adicionar componente de toast para feedback de sucesso/erro
  - Toasts de sucesso: "Contato criado", "Contato atualizado", "Contato excluído"
  - Toasts de erro: mensagem do servidor + log no console (ContactDialog inline + toast; delete só toast)
- [x] 6.2 Estado de loading global na tabela (skeleton rows durante fetch inicial)
- [x] 6.3 Tratamento de erro na conexão com o MCP (ex: token inválido, servidor offline)
  - API Routes retornam erro HTTP 500 com mensagem
  - Frontend exibe mensagem amigável + botão "Tentar novamente" via estado fetchError em page.tsx
- [x] 6.4 Revisão de responsividade básica (overflow-x-auto no container da tabela)
- [x] 6.5 Revisar acessibilidade básica (lang="pt-BR" no html, labels+htmlFor, aria-label nos botões de ação, autoFocus no primeiro campo do dialog)

### Critério de conclusão
`npm run build` sem erros. UX com feedback visual em todos os fluxos.

---

## Fase 7 — Deploy na Vercel

**Objetivo**: aplicação rodando em produção com dados reais do MCP.

### Tarefas

- [ ] 7.1 Criar repositório Git e commitar o projeto
  ```bash
  git init
  git add .
  git commit -m "feat: initial implementation"
  ```
- [ ] 7.2 Fazer push para GitHub
- [ ] 7.3 Importar repositório na Vercel (vercel.com/new)
- [ ] 7.4 Configurar variáveis de ambiente na Vercel
  - `MCP_SERVER_URL=https://contatos-mcp.onrender.com`
  - `MCP_API_KEY=<token>`
- [ ] 7.5 Acionar deploy e aguardar conclusão
- [ ] 7.6 Smoke test em produção: listar, criar, editar, excluir

### Critério de conclusão
URL pública da Vercel com todos os fluxos funcionando contra o MCP de produção.

---

## Resumo das Fases

| Fase | Descrição | Entregável |
|------|-----------|-----------|
| 1 | Scaffold Next.js + shadcn/ui | Projeto rodando localmente |
| 2 | Integração MCP (lib + API Routes) | `GET /api/contacts` retorna dados reais |
| 3 | DataGrid (ContactsTable) | Lista de contatos visível na UI |
| 4 | Modal Add/Edit (ContactDialog) | CRUD de criar e editar funcionando |
| 5 | Exclusão com confirmação | CRUD completo |
| 6 | Polish e tratamento de erros | Build limpo, UX com feedback |
| 7 | Deploy na Vercel | URL pública em produção |

---

## Dependências por Fase

```
Fase 1 (scaffold)
  └── Fase 2 (MCP)
        └── Fase 3 (tabela)
              ├── Fase 4 (dialog)
              │     └── Fase 5 (excluir)
              │           └── Fase 6 (polish)
              │                 └── Fase 7 (deploy)
              └── Fase 5 (excluir)
```

As fases 4 e 5 podem ser desenvolvidas em paralelo após a Fase 3.
