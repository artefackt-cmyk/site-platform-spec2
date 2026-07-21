import { permanentRedirect } from "next/navigation";

export default function LegacyWebsiteBuilderPage() {
  permanentRedirect("/website-builder");
}
