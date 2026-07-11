import { loadPublicConfig } from "@site-platform/config";
import { DashboardApp } from "./dashboard-app";

export default function Page() {
  const config = loadPublicConfig();

  return <DashboardApp apiUrl={config.apiUrl} />;
}
