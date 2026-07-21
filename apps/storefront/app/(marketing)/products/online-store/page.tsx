import { permanentRedirect } from "next/navigation";

export default function LegacyOnlineStorePage() {
  permanentRedirect("/online-store");
}
