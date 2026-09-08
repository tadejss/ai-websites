"use client";

import { useState, useTransition } from "react";
import { TEMPLATE_IDS, type TemplateId } from "@/templates/types";
import { Button } from "@/components/admin/ui/button";

type Props = {
  slug: string;
  currentTemplateId: TemplateId | null;
};

export function AdminTemplateOverride({ slug, currentTemplateId }: Props) {
  const [templateId, setTemplateId] = useState<TemplateId | "">(
    currentTemplateId ?? "",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    if (!templateId) {
      setMessage("Izberi template");
      return;
    }

    startTransition(async () => {
      setMessage(null);
      try {
        const response = await fetch(`/api/admin/template/${slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          error?: string;
          templateId?: string;
        };
        if (!response.ok) {
          throw new Error(data.error || "Shranjevanje ni uspelo");
        }
        setMessage(`Shranjeno: ${data.templateId}`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Napaka");
      }
    });
  }

  return (
    <div className="space-y-3 text-sm">
      <p className="text-[var(--admin-muted)]">
        Prepiši template za ta demo (zmaga nad category assign).
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="rounded border border-white/15 bg-black px-2 py-1.5 text-sm"
          value={templateId}
          onChange={(event) =>
            setTemplateId(event.target.value as TemplateId | "")
          }
          disabled={pending}
        >
          <option value="">— izberi —</option>
          {TEMPLATE_IDS.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={pending || !templateId}
          onClick={save}
        >
          {pending ? "Shranjujem…" : "Shrani template"}
        </Button>
      </div>
      {message ? (
        <p className="text-xs text-[var(--admin-muted)]">{message}</p>
      ) : null}
    </div>
  );
}
