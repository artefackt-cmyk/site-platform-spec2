import * as React from "react";
import type { ReactNode } from "react";
import { PublicThemeBoot } from "../../components/public/theme-boot";
import "../../styles/public-site.css";

type MarketingLayoutProps = {
  readonly children: ReactNode;
};

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <>
      <PublicThemeBoot />
      {children}
    </>
  );
}
