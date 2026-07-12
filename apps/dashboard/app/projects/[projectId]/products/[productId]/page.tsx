import { loadPublicConfig } from "@site-platform/config";
import { ProductEditorApp } from "../../../../product-editor-app";

type ProductPageProps = {
  readonly params: Promise<{
    readonly projectId: string;
    readonly productId: string;
  }>;
};

export default async function Page({ params }: ProductPageProps) {
  const config = loadPublicConfig();
  const { projectId, productId } = await params;

  return (
    <ProductEditorApp
      apiUrl={config.apiUrl}
      projectId={projectId}
      productId={productId}
    />
  );
}
