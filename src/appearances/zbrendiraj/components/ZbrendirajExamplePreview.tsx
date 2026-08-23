type Props = {
  href: string;
  title: string;
};

export function ZbrendirajExamplePreview({ href, title }: Props) {
  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-[#111]">
      <iframe
        src={href}
        title={title}
        className="pointer-events-none absolute left-0 top-0 h-[200%] w-[200%] origin-top-left scale-50 border-0"
        loading="lazy"
        tabIndex={-1}
      />
    </div>
  );
}

