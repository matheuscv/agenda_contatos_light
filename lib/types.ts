export type Contact = {
  id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  empresa?: string | null;
  observacoes?: string | null;
  criado_em?: string | null;
};

export type ContactInput = Omit<Contact, "id" | "criado_em">;
