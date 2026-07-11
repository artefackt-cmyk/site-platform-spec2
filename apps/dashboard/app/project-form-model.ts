import {
  DOMAIN_ERROR_CODES,
  validateProjectName,
  validateProjectSlug
} from "@site-platform/domain";
import type { CreateProjectFormValues } from "./dashboard-types";

export type ProjectFormValidationResult =
  | {
      readonly ok: true;
      readonly values: CreateProjectFormValues;
    }
  | {
      readonly ok: false;
      readonly message: string;
    };

export function validateCreateProjectForm(
  values: CreateProjectFormValues
): ProjectFormValidationResult {
  const nameResult = validateProjectName(values.name);

  if (!nameResult.ok) {
    return {
      ok: false,
      message: toProjectFormMessage(nameResult.code)
    };
  }

  const slugResult = validateProjectSlug(values.slug);

  if (!slugResult.ok) {
    return {
      ok: false,
      message: toProjectFormMessage(slugResult.code)
    };
  }

  return {
    ok: true,
    values: {
      name: nameResult.value,
      slug: slugResult.value
    }
  };
}

function toProjectFormMessage(code: string): string {
  switch (code) {
    case DOMAIN_ERROR_CODES.projectNameRequired:
      return "Введите название проекта.";
    case DOMAIN_ERROR_CODES.projectNameTooShort:
      return "Название проекта должно быть длиннее.";
    case DOMAIN_ERROR_CODES.projectNameTooLong:
      return "Название проекта слишком длинное.";
    case DOMAIN_ERROR_CODES.projectSlugRequired:
      return "Введите адрес проекта.";
    case DOMAIN_ERROR_CODES.projectSlugTooShort:
      return "Адрес проекта должен быть длиннее.";
    case DOMAIN_ERROR_CODES.projectSlugTooLong:
      return "Адрес проекта слишком длинный.";
    case DOMAIN_ERROR_CODES.projectSlugInvalidFormat:
      return "Адрес может содержать только латинские строчные буквы, цифры и дефисы.";
    default:
      return "Проверьте данные проекта.";
  }
}
