import * as React from "react";

export function PublicThemeBoot() {
  const script = `
    (() => {
      try {
        const queryTheme = new URLSearchParams(window.location.search).get('publicTheme');
        const cookieTheme = document.cookie
          .split('; ')
          .find((row) => row.startsWith('mercurio-public-theme='))
          ?.split('=')[1];
        const requested = queryTheme === 'light' || queryTheme === 'dark' || queryTheme === 'system'
          ? queryTheme
          : null;
        if (requested) {
          localStorage.setItem('mercurio-public-theme', requested);
          document.cookie = 'mercurio-public-theme=' + requested + '; Path=/; Max-Age=31536000; SameSite=Lax';
          const cleanUrl = window.location.pathname + window.location.hash;
          window.history.replaceState(null, '', cleanUrl);
        }
        const stored = localStorage.getItem('mercurio-public-theme') || cookieTheme;
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const mode = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
        const resolved = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;
        document.documentElement.dataset.publicTheme = resolved;
        document.documentElement.dataset.publicThemeMode = mode;
      } catch {
        document.documentElement.dataset.publicTheme = 'light';
        document.documentElement.dataset.publicThemeMode = 'system';
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
