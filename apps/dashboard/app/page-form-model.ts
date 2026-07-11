import {
  DOMAIN_ERROR_CODES,
  validatePageSlug,
  validatePageTitle
} from "@site-platform/domain";
import type { CreatePageFormValues } from "./dashboard-types";

export type PageFormValidationResult =
  | {
      readonly ok: true;
      readonly values: CreatePageFormValues;
    }
  | {
      readonly ok: false;
      readonly message: string;
    };

export function validateCreatePageForm(
  values: CreatePageFormValues
): PageFormValidationResult {
  const titleResult = validatePageTitle(values.title);

  if (!titleResult.ok) {
    return {
      ok: false,
      message: toPageFormMessage(titleResult.code)
    };
  }

  const slugResult = validatePageSlug(values.slug);

  if (!slugResult.ok) {
    return {
      ok: false,
      message: toPageFormMessage(slugResult.code)
    };
  }

  return {
    ok: true,
    values: {
      title: titleResult.value,
      slug: slugResult.value,
      isHome: values.isHome
    }
  };
}

function toPageFormMessage(code: string): string {
  switch (code) {
    case DOMAIN_ERROR_CODES.pageTitleRequired:
      return "Введите название страницы.";
    case DOMAIN_ERROR_CODES.pageTitleTooShort:
      return "Название страницы должно быть длиннее.";
    case DOMAIN_ERROR_CODES.pageTitleTooLong:
      return "Название страницы слишком длинное.";
    case DOMAIN_ERROR_CODES.pageSlugRequired:
      return "Введите адрес страницы.";
    case DOMAIN_ERROR_CODES.pageSlugTooShort:
      return "Адрес страницы должен быть длиннее.";
    case DOMAIN_ERROR_CODES.pageSlugTooLong:
      return "Адрес страницы слишком длинный.";
    case DOMAIN_ERROR_CODES.pageSlugInvalidFormat:
      return "Адрес может содержать только латинские строчные буквы, цифры и дефисы.";
    default:
      return "Проверьте данные страницы.";
  }
}
