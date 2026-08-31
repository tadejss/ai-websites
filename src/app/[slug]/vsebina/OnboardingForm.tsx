"use client";

import { useCallback, useMemo, useState } from "react";
import type { CustomerOnboardingAnswers, OnboardingStatus } from "@/onboarding/types";
import { isOnboardingLockedForCustomerEdits } from "@/onboarding/types";
import { listOnboardingImages, syncOnboardingImageFields } from "@/onboarding/images";
import { ImageUploadField } from "./ImageUploadField";

type Props = {
  slug: string;
  token: string;
  initialPrefill: CustomerOnboardingAnswers;
  initialStatus: string;
};

type Step = 1 | 2 | 3;

const emptyAnswers = (): CustomerOnboardingAnswers => ({});

function ListField({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-200">{label}</label>
      <div className="mt-2 space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={value}
              onChange={(event) => {
                const next = [...values];
                next[index] = event.target.value;
                onChange(next);
              }}
              placeholder={placeholder}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              className="shrink-0 rounded-lg px-2 text-xs text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...values, ""])}
          className="text-sm text-lime-300 hover:underline"
        >
          + Dodaj vrstico
        </button>
      </div>
    </div>
  );
}

export function OnboardingForm({
  slug,
  token,
  initialPrefill,
  initialStatus,
}: Props) {
  const [step, setStep] = useState<Step>(1);
  const [answers, setAnswers] = useState<CustomerOnboardingAnswers>(() =>
    syncOnboardingImageFields({
      ...emptyAnswers(),
      ...initialPrefill,
      services: initialPrefill.services?.length
        ? initialPrefill.services
        : [""],
      sellingPoints: initialPrefill.sellingPoints?.length
        ? initialPrefill.sellingPoints
        : ["", "", ""],
    }),
  );
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readOnly = useMemo(
    () => isOnboardingLockedForCustomerEdits(status as OnboardingStatus),
    [status],
  );

  const patchAnswers = useCallback(
    (patch: Partial<CustomerOnboardingAnswers>) => {
      setAnswers((current) => syncOnboardingImageFields({ ...current, ...patch }));
    },
    [],
  );

  const setAnswersSynced = useCallback((next: CustomerOnboardingAnswers) => {
    setAnswers(syncOnboardingImageFields(next));
  }, []);

  async function saveDraft() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/onboarding/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, answers }),
      });
      const data = (await response.json()) as { error?: string; status?: string };
      if (!response.ok) {
        throw new Error(data.error || "Shranjevanje ni uspelo");
      }
      if (data.status) {
        setStatus(data.status);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Shranjevanje ni uspelo");
    } finally {
      setLoading(false);
    }
  }

  async function submitForm() {
    setLoading(true);
    setError(null);
    try {
      const payload = syncOnboardingImageFields({
        ...answers,
        services: (answers.services ?? []).map((s) => s.trim()).filter(Boolean),
        sellingPoints: (answers.sellingPoints ?? [])
          .map((s) => s.trim())
          .filter(Boolean),
      });

      const response = await fetch(`/api/onboarding/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, answers: payload }),
      });
      const data = (await response.json()) as {
        error?: string;
        status?: string;
        details?: { fieldErrors?: Record<string, string[]> };
      };

      if (!response.ok) {
        const fieldError = data.details?.fieldErrors
          ? Object.values(data.details.fieldErrors).flat()[0]
          : undefined;
        throw new Error(fieldError || data.error || "Oddaja ni uspela");
      }

      if (data.status) {
        setStatus(data.status);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Oddaja ni uspela");
    } finally {
      setLoading(false);
    }
  }


  if (readOnly) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <h2 className="text-xl font-semibold">Hvala — podatki so prejeti</h2>
        <p className="mt-3 text-sm text-zinc-400">
          Pripravljamo vašo stran. Pred objavo jo preverimo in vas obvestimo.
        </p>
        <p className="mt-2 text-xs uppercase tracking-wide text-lime-300">
          Status: {status.replaceAll("_", " ")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={step === n ? "text-lime-300" : undefined}
          >
            Korak {n}/3
          </span>
        ))}
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Podjetje in kontakt</h2>
          {[
            ["companyName", "Ime podjetja"],
            ["contactPerson", "Kontaktna oseba"],
            ["email", "Email"],
            ["phone", "Telefon"],
            ["address", "Naslov"],
            ["taxId", "Davčna številka (opcijsko)"],
          ].map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="font-medium text-zinc-300">{label}</span>
              <input
                type={key === "email" ? "email" : "text"}
                value={(answers[key as keyof CustomerOnboardingAnswers] as string) ?? ""}
                onChange={(event) =>
                  patchAnswers({
                    [key]: event.target.value,
                  } as Partial<CustomerOnboardingAnswers>)
                }
                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white"
              />
            </label>
          ))}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Ponudba</h2>
          <label className="block text-sm">
            <span className="font-medium text-zinc-300">Kratek opis podjetja</span>
            <textarea
              value={answers.businessDescription ?? ""}
              onChange={(event) =>
                patchAnswers({ businessDescription: event.target.value })
              }
              rows={4}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white"
            />
          </label>
          <ListField
            label="Glavne storitve / izdelki"
            values={answers.services ?? [""]}
            onChange={(services) => patchAnswers({ services })}
            placeholder="npr. Striženje, Barvanje"
          />
          <ListField
            label="Glavne prednosti (USP)"
            values={answers.sellingPoints ?? ["", "", ""]}
            onChange={(sellingPoints) => patchAnswers({ sellingPoints })}
            placeholder="npr. 10+ let izkušenj"
          />
          {[
            ["serviceArea", "Območje poslovanja"],
            ["openingHours", "Delovni čas"],
          ].map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="font-medium text-zinc-300">{label}</span>
              <input
                type="text"
                value={(answers[key as keyof CustomerOnboardingAnswers] as string) ?? ""}
                onChange={(event) =>
                  patchAnswers({
                    [key]: event.target.value,
                  } as Partial<CustomerOnboardingAnswers>)
                }
                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white"
              />
            </label>
          ))}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Stran</h2>
          <label className="block text-sm">
            <span className="font-medium text-zinc-300">Želena domena</span>
            <input
              type="text"
              value={answers.desiredDomain ?? ""}
              onChange={(event) => patchAnswers({ desiredDomain: event.target.value })}
              placeholder="npr. moj-salon.si"
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white"
            />
          </label>
          <p className="text-xs leading-relaxed text-zinc-500">
            Če domeno že imaš, vpiši njen naslov. Če jo potrebuješ, vpiši želeno
            domeno. Razpoložljivost lahko preveriš pri registrarju oziroma prek
            WHOIS/RDAP preverjanja.
          </p>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={answers.hasExistingDomain ?? false}
              onChange={(event) =>
                patchAnswers({ hasExistingDomain: event.target.checked })
              }
            />
            Domeno že imam
          </label>
          {[
            ["demoChanges", "Kaj želiš spremeniti na demo strani?"],
            ["colorPreferences", "Želene barve / vizualne spremembe"],
            ["additionalNotes", "Dodatne želje"],
          ].map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="font-medium text-zinc-300">{label}</span>
              <textarea
                value={(answers[key as keyof CustomerOnboardingAnswers] as string) ?? ""}
                onChange={(event) =>
                  patchAnswers({
                    [key]: event.target.value,
                  } as Partial<CustomerOnboardingAnswers>)
                }
                rows={3}
                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white"
              />
            </label>
          ))}

          <div className="grid gap-6 sm:grid-cols-2">
            <ImageUploadField
              slug={slug}
              token={token}
              kind="logo"
              label="Logotipi (upload)"
              answers={answers}
              onAnswersChange={setAnswersSynced}
              disabled={readOnly}
            />
            <ImageUploadField
              slug={slug}
              token={token}
              kind="photo"
              label="Fotografije (upload)"
              answers={answers}
              onAnswersChange={setAnswersSynced}
              disabled={readOnly}
            />
          </div>

          {listOnboardingImages(answers).length > 0 ? (
            <p className="text-xs text-zinc-500">
              Skupaj naloženih slik: {listOnboardingImages(answers).length}
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="flex flex-wrap gap-3 pt-2">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((current) => (current - 1) as Step)}
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white"
          >
            Nazaj
          </button>
        ) : null}

        {step < 3 ? (
          <button
            type="button"
            onClick={() => {
              void saveDraft();
              setStep((current) => (current + 1) as Step);
            }}
            className="rounded-full bg-lime-300 px-5 py-2.5 text-sm font-semibold text-zinc-950"
          >
            Naprej
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={() => void submitForm()}
            className="rounded-full bg-lime-300 px-5 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-60"
          >
            {loading ? "Pošiljam…" : "Oddaj podatke"}
          </button>
        )}
      </div>
    </div>
  );
}
