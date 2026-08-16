import { zbSectionEyebrow } from "../styles";

type Props = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
};

export function ZbrendirajSectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: Props) {
  return (
    <div
      className={
        align === "center"
          ? "mx-auto max-w-3xl text-center"
          : "max-w-xl text-left"
      }
    >
      <p className={`${zbSectionEyebrow}`}>
        {eyebrow}
      </p>
      <h2 className="font-display mt-5 text-4xl leading-[1.05] text-white sm:text-5xl lg:text-6xl">
        {title}
        {!title.endsWith(".") && !title.endsWith("!") && !title.endsWith("?")
          ? "."
          : ""}
      </h2>
      {description ? (
        <p className="mt-5 text-base leading-relaxed text-[#D0D0D0] sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
