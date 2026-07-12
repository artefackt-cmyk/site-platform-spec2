import { loadPublicConfig } from "@site-platform/config";
import { AuthPage } from "../auth-pages";

export default function ResetPasswordPage() {
  const config = loadPublicConfig();

  return <AuthPage apiUrl={config.apiUrl} kind="reset-password" />;
}
