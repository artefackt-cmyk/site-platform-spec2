import { loadPublicConfig } from "@site-platform/config";
import { ProductCatalogApp } from "../../../product-catalog-app";

type ProductsPageProps = {
  readonly params: Promise<{
    readonly projectId: string;
  }>;
};

export default async function Page({ params }: ProductsPageProps) {
  const config = loadPublicConfig();
  const { projectId } = await params;

  return <ProductCatalogApp apiUrl={config.apiUrl} projectId={projectId} />;
}
