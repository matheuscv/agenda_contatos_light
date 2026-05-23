"use client";

import { useCallback, useEffect, useState } from "react";

import { ContactsTable } from "@/components/contacts-table";
import { Contact } from "@/lib/types";

export default function Home() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

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
        onNew={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    </main>
  );
}
