import { getFactoryWorkerConfig } from "@/factory/config";
import { getEntityIndexCount } from "@/admin/entity-index";
import { AdminSettingsClient } from "@/components/admin/admin-settings-client";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [factory, indexCount] = await Promise.all([
    Promise.resolve(getFactoryWorkerConfig()),
    getEntityIndexCount(),
  ]);

  return (
    <AdminSettingsClient
      data={{
        factory,
        indexCount,
      }}
    />
  );
}
