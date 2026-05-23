import { callTool } from "@/lib/mcp";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nome, email, telefone, empresa, observacoes } = body;
    const data = await callTool("atualizar_contato", {
      id: Number(id),
      ...(nome && { nome }),
      ...(email && { email }),
      ...(telefone !== undefined && { telefone }),
      ...(empresa !== undefined && { empresa }),
      ...(observacoes !== undefined && { observacoes }),
    });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await callTool("excluir_contato", { id: Number(id) });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
