import * as React from "react";
import { Footer } from "./footer";
import { Header } from "./header";

export function PublicShell({
  children,
  dashboardUrl
}: {
  readonly children: React.ReactNode;
  readonly dashboardUrl: string;
}) {
  return (
    <div className="public-site">
      <Header dashboardUrl={dashboardUrl} />
      <main>{children}</main>
      <Footer dashboardUrl={dashboardUrl} />
    </div>
  );
}
