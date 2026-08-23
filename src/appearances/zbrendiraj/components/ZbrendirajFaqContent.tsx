import { ZBRENDIRAJ_FAQ } from "../faq";

export function ZbrendirajFaqContent() {
  return (
    <div className="space-y-0 divide-y divide-border">
      {ZBRENDIRAJ_FAQ.map((item) => (
        <details key={item.question} className="group py-6 first:pt-0 last:pb-0">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-display text-xl text-foreground transition-colors hover:text-accent sm:text-2xl [&::-webkit-details-marker]:hidden">
            <span>{item.question}</span>
            <span
              aria-hidden="true"
              className="mt-1 shrink-0 text-accent transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
