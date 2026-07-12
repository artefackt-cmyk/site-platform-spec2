import { loadPublicConfig } from "@site-platform/config";
import { AuthPage } from "../auth-pages";

export default function ForgotPasswordPage() {
  const config = loadPublicConfig();

  return <AuthPage apiUrl={config.apiUrl} kind="forgot-password" />;
}
