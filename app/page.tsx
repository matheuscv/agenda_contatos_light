"use client";

import { useCallback, useEffect, useState } from "react";

import { ContactDialog } from "@/components/contact-dialog";
import { ContactsTable } from "@/components/contacts-table";
import { Contact } from "@/lib/types";

type DialogState = {
  open: boolean;
  mode: "create" | "edit";
  contact?: Contact;
};

export default function Home() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    mode: "create",
  });

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contacts");
      if (!res.ok) throw new Error("Falha ao carregar contatos");
      const data: Contact[] = await res.json();
      setContacts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="mb-6 text-2xl font-semibold">Agenda de Contatos</h1>
      <ContactsTable
        contacts={contacts}
        loading={loading}
        onNew={() => setDialog({ open: true, mode: "create" })}
        onEdit={(contact) => setDialog({ open: true, mode: "edit", contact })}
        onDelete={fetchContacts}
      />
      <ContactDialog
        mode={dialog.mode}
        contact={dialog.contact}
        open={dialog.open}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
        onSuccess={fetchContacts}
      />
    </main>
  );
}
