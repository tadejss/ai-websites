import { zbCardPadding } from "../styles";

const stepCount = 4;

export function ZbrendirajTimelineGraphic() {
  return (
    <div
      className={`relative flex h-full min-h-[420px] items-center justify-center ${zbCardPadding}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative flex flex-col items-center">
        {Array.from({ length: stepCount }, (_, index) => {
          const isLast = index === stepCount - 1;

          return (
            <div key={index} className="flex flex-col items-center">
              <div className="flex size-12 items-center justify-center rounded-full border-2 border-accent bg-black shadow-[0_0_24px_rgba(199,255,61,0.15)]">
                <span className="font-display text-base font-semibold text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              {!isLast ? (
                <div className="flex flex-col items-center py-2">
                  <div className="h-14 w-px bg-gradient-to-b from-accent/80 to-accent/25" />
                  <svg
                    viewBox="0 0 12 8"
                    className="mt-1 size-3.5 text-accent/70"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M6 8 0 0h12L6 8Z" />
                  </svg>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
