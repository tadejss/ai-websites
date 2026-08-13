"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import type { SiteConfig } from "@/content/types/site";

type Props = {
  siteSlug: string;
  siteConfig: SiteConfig;
  inputClassName: string;
  labelClassName: string;
  submitButton: ReactNode;
};

type FormState = "idle" | "loading" | "success" | "error";

export function ContactForm({
  siteSlug,
  siteConfig,
  inputClassName,
  labelClassName,
  submitButton,
}: Props) {
  const { form } = siteConfig.contact;
  const { privacy } = siteConfig;
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const fields = privacy.contactForm.fields;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!privacy.contactForm.enabled) {
      setState("error");
      setErrorMessage("Kontaktni obrazec trenutno ni na voljo.");
      return;
    }

    if (fields.includes("name") && !name.trim()) {
      setState("error");
      setErrorMessage("Prosimo, vnesite ime.");
      return;
    }

    if (fields.includes("phone") && !phone.trim()) {
      setState("error");
      setErrorMessage("Prosimo, vnesite telefonsko številko.");
      return;
    }

    if (fields.includes("message") && !message.trim()) {
      setState("error");
      setErrorMessage("Prosimo, vnesite sporočilo.");
      return;
    }

    setState("loading");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: siteSlug,
          name: name.trim(),
          phone: phone.trim(),
          message: message.trim(),
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setState("error");
        setErrorMessage(data.error ?? "Pošiljanje ni uspelo. Poskusite znova.");
        return;
      }

      setState("success");
      setName("");
      setPhone("");
      setMessage("");
    } catch {
      setState("error");
      setErrorMessage("Pošiljanje ni uspelo. Poskusite znova.");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h3 className="text-lg font-semibold text-foreground">{form.title}</h3>
      <p className="mt-1 text-sm text-muted">{form.description}</p>

      <div className="mt-6 space-y-4" aria-busy={state === "loading"}>
        {fields.includes("name") ? (
          <div>
            <label htmlFor="contact-name" className={labelClassName}>
              {form.nameLabel}
            </label>
            <input
              id="contact-name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClassName}
              placeholder={form.namePlaceholder}
              disabled={state === "loading"}
            />
          </div>
        ) : null}

        {fields.includes("phone") ? (
          <div>
            <label htmlFor="contact-phone" className={labelClassName}>
              {form.phoneLabel}
            </label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={inputClassName}
              placeholder={form.phonePlaceholder}
              disabled={state === "loading"}
            />
          </div>
        ) : null}

        {fields.includes("message") ? (
          <div>
            <label htmlFor="contact-message" className={labelClassName}>
              {form.messageLabel}
            </label>
            <textarea
              id="contact-message"
              name="message"
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className={inputClassName}
              placeholder={form.messagePlaceholder}
              disabled={state === "loading"}
            />
          </div>
        ) : null}

        <div>{submitButton}</div>

        {state === "success" ? (
          <p className="text-sm text-green-700" role="status">
            Hvala! Vaše sporočilo je bilo poslano.
          </p>
        ) : null}

        {state === "error" && errorMessage ? (
          <p className="text-sm text-red-600" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </form>
  );
}
