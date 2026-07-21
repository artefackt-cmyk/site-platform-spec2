import { redirect } from "next/navigation";
import { buildAuthRedirectUrl } from "../../../components/public/auth-redirect";

export default async function LoginRedirectPage({
  searchParams
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirect(buildAuthRedirectUrl("login", await searchParams));
}
