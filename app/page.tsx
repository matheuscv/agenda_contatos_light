"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ContactDialog } from "@/components/contact-dialog";
import { ContactsTable } from "@/components/contacts-table";
import { Button } from "@/components/ui/button";
import { Contact } from "@/lib/types";

type DialogState = {
  open: boolean;
  mode: "create" | "edit";
  contact?: Contact;
};

export default function Home() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    mode: "create",
  });

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/contacts");
      if (!res.ok) throw new Error("Falha ao carregar contatos");
      const data: Contact[] = await res.json();
      setContacts(data);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao carregar contatos";
      console.error(err);
      setFetchError(msg);
      toast.error(msg);
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

      {fetchError && !loading ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">{fetchError}</p>
          <Button variant="outline" onClick={fetchContacts}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <ContactsTable
          contacts={contacts}
          loading={loading}
          onNew={() => setDialog({ open: true, mode: "create" })}
          onEdit={(contact) =>
            setDialog({ open: true, mode: "edit", contact })
          }
          onDelete={fetchContacts}
        />
      )}

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
