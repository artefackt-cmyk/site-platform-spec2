import { loadPublicConfig } from "@site-platform/config";
import { OrdersApp } from "../../../orders-app";

type OrdersPageProps = {
  readonly params: Promise<{
    readonly projectId: string;
  }>;
};

export default async function Page({ params }: OrdersPageProps) {
  const { projectId } = await params;
  const config = loadPublicConfig();

  return <OrdersApp apiUrl={config.apiUrl} projectId={projectId} />;
}
