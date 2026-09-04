import Link from "next/link";
import { IMAGE_POOL_CATEGORY_IDS } from "@/images/image-pool-category";
import { allLooks } from "@/catalog/looks";
import { getCatalogPalette } from "@/catalog/palettes";
import { getCatalogFontPairing } from "@/catalog/fonts";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatGrid,
} from "@/components/admin/admin-page";
import { Badge } from "@/components/admin/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ category?: string }>;
};

export default async function AdminCatalogPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const activeCategory =
    category && IMAGE_POOL_CATEGORY_IDS.includes(category as never)
      ? category
      : undefined;

  const looks = activeCategory
    ? allLooks.filter((look) => look.categoryId === activeCategory)
    : allLooks;

  const approvedCount = allLooks.filter((look) => look.status === "approved").length;

  return (
    <div>
      <AdminPageHeader
        title="Look Catalog"
        description="Kurirani website looki po kategorijah — paleta, font, layout profil."
      />

      <AdminStatGrid className="mb-6">
        <AdminStatCard label="Skupaj lookov" value={String(allLooks.length)} />
        <AdminStatCard label="Approved" value={String(approvedCount)} />
        <AdminStatCard label="Kategorij" value={String(IMAGE_POOL_CATEGORY_IDS.length)} />
        <AdminStatCard
          label="Prikazano"
          value={String(looks.length)}
        />
      </AdminStatGrid>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/admin/catalog"
          className={`rounded-full border px-3 py-1 text-xs ${!activeCategory ? "border-[var(--admin-accent)]/50 bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]" : "border-[var(--admin-border)] text-[var(--admin-muted)] hover:text-[var(--admin-foreground)]"}`}
        >
          Vse
        </Link>
        {IMAGE_POOL_CATEGORY_IDS.map((categoryId) => (
          <Link
            key={categoryId}
            href={`/admin/catalog?category=${categoryId}`}
            className={`rounded-full border px-3 py-1 text-xs ${activeCategory === categoryId ? "border-[var(--admin-accent)]/50 bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]" : "border-[var(--admin-border)] text-[var(--admin-muted)] hover:text-[var(--admin-foreground)]"}`}
          >
            {categoryId}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {looks.map((look) => {
          const palette = getCatalogPalette(look.theme.paletteId);
          const font = getCatalogFontPairing(look.theme.fontPairingId);
          const swatches = palette?.swatches ?? [];

          return (
            <Card key={look.id} className="overflow-hidden">
              <div
                className="flex h-16"
                aria-hidden="true"
              >
                {swatches.slice(0, 5).map((color) => (
                  <div
                    key={color}
                    className="flex-1"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm leading-snug">{look.displayName}</CardTitle>
                  <Badge variant={look.status === "approved" ? "success" : "default"}>
                    {look.status}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--admin-muted)]">{look.id}</p>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-[var(--admin-muted)]">
                <p>{look.description}</p>
                <p>
                  <span className="text-[var(--admin-foreground)]">Hero:</span>{" "}
                  {look.designTokens.heroStyle}
                </p>
                <p>
                  <span className="text-[var(--admin-foreground)]">Kartice:</span>{" "}
                  {look.designTokens.cardTreatment}
                </p>
                <p>
                  <span className="text-[var(--admin-foreground)]">Paleta:</span>{" "}
                  {look.theme.paletteId}
                </p>
                <p>
                  <span className="text-[var(--admin-foreground)]">Font:</span>{" "}
                  {font?.name ?? look.theme.fontPairingId}
                </p>
                <p>
                  <span className="text-[var(--admin-foreground)]">Layout:</span>{" "}
                  {look.layout.profileId}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
