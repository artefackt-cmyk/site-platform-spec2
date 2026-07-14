import type { CreateSiteFormValues, UpdateSiteFormValues } from "./dashboard-types";

export type SiteFormValidationResult =
  | {
      readonly ok: true;
      readonly values: CreateSiteFormValues;
    }
  | {
      readonly ok: false;
      readonly message: string;
      readonly field?: keyof CreateSiteFormValues;
    };

export function createSlugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/ё/g, "e")
    .replace(/й/g, "i")
    .replace(/ц/g, "c")
    .replace(/у/g, "u")
    .replace(/к/g, "k")
    .replace(/е/g, "e")
    .replace(/н/g, "n")
    .replace(/г/g, "g")
    .replace(/ш/g, "sh")
    .replace(/щ/g, "sch")
    .replace(/з/g, "z")
    .replace(/х/g, "h")
    .replace(/ъ/g, "")
    .replace(/ф/g, "f")
    .replace(/ы/g, "y")
    .replace(/в/g, "v")
    .replace(/а/g, "a")
    .replace(/п/g, "p")
    .replace(/р/g, "r")
    .replace(/о/g, "o")
    .replace(/л/g, "l")
    .replace(/д/g, "d")
    .replace(/ж/g, "zh")
    .replace(/э/g, "e")
    .replace(/я/g, "ya")
    .replace(/ч/g, "ch")
    .replace(/с/g, "s")
    .replace(/м/g, "m")
    .replace(/и/g, "i")
    .replace(/т/g, "t")
    .replace(/ь/g, "")
    .replace(/б/g, "b")
    .replace(/ю/g, "yu")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function validateSiteForm(
  values: CreateSiteFormValues | UpdateSiteFormValues
): SiteFormValidationResult {
  const name = values.name.trim();
  const slug = values.slug.trim().toLowerCase();

  if (name.length < 2) {
    return {
      ok: false,
      field: "name",
      message: "Название сайта должно быть не короче 2 символов."
    };
  }

  if (name.length > 80) {
    return {
      ok: false,
      field: "name",
      message: "Название сайта должно быть не длиннее 80 символов."
    };
  }

  if (slug.length < 2) {
    return {
      ok: false,
      field: "slug",
      message: "Slug должен быть не короче 2 символов."
    };
  }

  if (slug.length > 64) {
    return {
      ok: false,
      field: "slug",
      message: "Slug должен быть не длиннее 64 символов."
    };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      ok: false,
      field: "slug",
      message: "Используйте латиницу, цифры и дефисы без пробелов."
    };
  }

  return {
    ok: true,
    values: {
      name,
      slug
    }
  };
}

