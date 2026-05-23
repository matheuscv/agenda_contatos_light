import { callTool } from "@/lib/mcp";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await callTool("listar_contatos");
    // A tool retorna { result: Contact[] }
    const contacts = data?.result ?? data;
    return NextResponse.json(contacts);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, email, telefone, empresa, observacoes } = body;
    const data = await callTool("criar_contato", {
      nome,
      email,
      ...(telefone && { telefone }),
      ...(empresa && { empresa }),
      ...(observacoes && { observacoes }),
    });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
