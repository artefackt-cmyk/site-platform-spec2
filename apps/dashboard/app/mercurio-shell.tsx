import * as React from "react";
import { MercurioLogo } from "@site-platform/ui";
import type { CurrentUserResponse, ProjectSummary } from "./dashboard-types";

export type MercurioShellArea =
  | "projects"
  | "project"
  | "pages"
  | "products"
  | "media"
  | "editor"
  | "preview";

type MercurioNavItem = {
  readonly id: MercurioShellArea;
  readonly label: string;
  readonly href: string;
  readonly icon: "folder" | "grid" | "page" | "box" | "image";
};

export function MercurioAppShell({
  activeArea,
  project,
  user,
  children
}: {
  readonly activeArea: MercurioShellArea;
  readonly project?: ProjectSummary | undefined;
  readonly user?: CurrentUserResponse | undefined;
  readonly children?: React.ReactNode;
}) {
  return (
    <main className="dashboard-shell mercurio-app-shell">
      <MercurioSidebar activeArea={activeArea} project={project} />
      <section className="mercurio-main">
        <MercurioTopbar project={project} user={user} />
        <section className="dashboard-panel">{children}</section>
      </section>
    </main>
  );
}

function MercurioSidebar({
  activeArea,
  project
}: {
  readonly activeArea: MercurioShellArea;
  readonly project?: ProjectSummary | undefined;
}) {
  const projectId = project?.id;
  const rootNavItem: MercurioNavItem = {
    id: "projects",
    label: "Проекты",
    href: "/",
    icon: "folder"
  };
  const projectNavItems: readonly MercurioNavItem[] =
    projectId === undefined
      ? []
      : [
          {
            id: "project",
            label: "Обзор",
            href: `/projects/${projectId}`,
            icon: "grid"
          },
          {
            id: "pages",
            label: "Страницы",
            href: `/projects/${projectId}`,
            icon: "page"
          },
          {
            id: "products",
            label: "Товары",
            href: `/projects/${projectId}/products`,
            icon: "box"
          },
          {
            id: "media",
            label: "Медиа",
            href: `/projects/${projectId}/media`,
            icon: "image"
          }
        ];
  const navItems: readonly MercurioNavItem[] = [
    rootNavItem,
    ...projectNavItems
  ];

  return (
    <aside className="mercurio-sidebar">
      <a className="mercurio-sidebar-logo" href="/" aria-label="Mercurio projects">
        <MercurioLogo variant="icon" size={40} />
      </a>
      <nav className="mercurio-sidebar-nav" aria-label="Основная навигация">
        {navItems.map((item) => (
          <a
            key={item.id}
            className={
              activeArea === item.id ||
              (activeArea === "editor" && item.id === "pages") ||
              (activeArea === "preview" && item.id === "pages")
                ? "mercurio-nav-item mercurio-nav-item-active"
                : "mercurio-nav-item"
            }
            href={item.href}
            aria-current={
              activeArea === item.id ||
              (activeArea === "editor" && item.id === "pages") ||
              (activeArea === "preview" && item.id === "pages")
                ? "page"
                : undefined
            }
          >
            <MercurioNavIcon name={item.icon} />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
      <section className="mercurio-brand-panel" aria-label="Mercurio">
        <strong>Clarity.<br />Velocity.<br />Advantage.</strong>
        <p>Mercurio помогает запускать и масштабировать бренды в цифровой среде.</p>
      </section>
    </aside>
  );
}

function MercurioTopbar({
  project,
  user
}: {
  readonly project?: ProjectSummary | undefined;
  readonly user?: CurrentUserResponse | undefined;
}) {
  return (
    <header className="mercurio-topbar">
      <MercurioLogo className="mercurio-topbar-logo-wide" variant="compact" />
      <MercurioLogo
        className="mercurio-topbar-logo-narrow"
        variant="icon"
        size={40}
      />
      {project === undefined ? null : (
        <div className="mercurio-context-chip" aria-label="Текущий проект">
          <MercurioNavIcon name="building" />
          <span>{project.name}</span>
        </div>
      )}
      <div className="mercurio-topbar-spacer" />
      {user === undefined ? null : (
        <div className="mercurio-user">
          <span className="mercurio-avatar" aria-hidden="true">
            {getInitials(user)}
          </span>
          <div>
            <strong>{user.displayName ?? user.email}</strong>
            <span>{user.role}</span>
          </div>
        </div>
      )}
    </header>
  );
}

function MercurioNavIcon({
  name
}: {
  readonly name: "folder" | "grid" | "page" | "box" | "image" | "building";
}) {
  const pathByName = {
    folder: "M5 18V8h6l2 3h6v7H5Zm0-7h14",
    grid: "M5 5h6v6H5V5Zm8 0h6v6h-6V5ZM5 13h6v6H5v-6Zm8 0h6v6h-6v-6Z",
    page: "M7 4h7l4 4v12H7V4Zm7 0v5h5",
    box: "M5 8l7-4 7 4v8l-7 4-7-4V8Zm7 4 7-4M12 12 5 8m7 4v8",
    image: "M5 6h14v12H5V6Zm3 9 3-4 2 2 2-3 3 5",
    building: "M6 20V5h8v15M4 20h16M9 8h2m-2 4h2m-2 4h2m5-3h2m-2 4h2"
  } as const;

  return (
    <svg
      className="mercurio-nav-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
    >
      <path
        d={pathByName[name]}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getInitials(user: CurrentUserResponse): string {
  const source = user.displayName ?? user.email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
