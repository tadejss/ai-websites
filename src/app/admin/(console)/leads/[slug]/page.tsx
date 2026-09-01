import { redirect } from "next/navigation";

export default async function LegacyLeadDetailRedirect({
  params,
}: PageProps<"/admin/leads/[slug]">) {
  const { slug } = await params;
  redirect(`/admin/e/${slug}`);
}
