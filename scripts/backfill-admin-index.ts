import { refreshAdminEntityIndex } from "@/admin/entity-index";

async function main() {
  const count = await refreshAdminEntityIndex();
  console.log(`Refreshed admin_entity_index for ${count} slugs`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
