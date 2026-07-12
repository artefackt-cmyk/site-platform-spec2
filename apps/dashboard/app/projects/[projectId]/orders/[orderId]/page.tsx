import { loadPublicConfig } from "@site-platform/config";
import { OrderDetailApp } from "../../../../orders-app";

type OrderPageProps = {
  readonly params: Promise<{
    readonly projectId: string;
    readonly orderId: string;
  }>;
};

export default async function Page({ params }: OrderPageProps) {
  const { projectId, orderId } = await params;
  const config = loadPublicConfig();

  return (
    <OrderDetailApp
      apiUrl={config.apiUrl}
      projectId={projectId}
      orderId={orderId}
    />
  );
}
