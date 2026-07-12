export type MarketingNavItem = {
  readonly label: string;
  readonly href: string;
};

export type AudienceCard = {
  readonly title: string;
  readonly text: string;
  readonly badge?: string;
};

export type FeatureCard = {
  readonly title: string;
  readonly text: string;
};

export type IntegrationStatus = "В разработке" | "Скоро";

export type IntegrationCard = {
  readonly title: string;
  readonly status: IntegrationStatus;
  readonly role: string;
};

export type InfrastructureStatus = "Уже работает" | "Следующий этап" | "Roadmap";

export type InfrastructureStep = {
  readonly label: string;
  readonly status: InfrastructureStatus;
  readonly icon: string;
};

export type ProjectScenario = {
  readonly title: string;
  readonly page: string;
  readonly detail: string;
};

export type CapabilityGroup = {
  readonly title: string;
  readonly items: readonly string[];
};

export const marketingNavItems: readonly MarketingNavItem[] = [
  { label: "Возможности", href: "#features" },
  { label: "Для бизнеса", href: "#audiences" },
  { label: "Интеграции", href: "#integrations" },
  { label: "О платформе", href: "#platform" }
];

export const audienceCards: readonly AudienceCard[] = [
  {
    title: "Малый и средний бизнес",
    text:
      "Запустите сайт и торговлю без отдельной команды разработки. Управляйте страницами, товарами, изображениями и публикациями самостоятельно."
  },
  {
    title: "Бренды и магазины",
    text:
      "Создавайте полноценный интернет-магазин, отдельные продуктовые лендинги и новые торговые форматы внутри одной системы."
  },
  {
    title: "Агентства",
    text:
      "Быстро собирайте клиентские проекты на гибкой платформе, не ограниченной готовыми шаблонами и однотипными решениями."
  },
  {
    title: "Маркетплейсы и многосторонние проекты",
    text:
      "Mercurio развивается в сторону создания собственных нишевых маркетплейсов и площадок с несколькими продавцами.",
    badge: "Направление развития"
  }
];

export const templateDifferenceCards: readonly FeatureCard[] = [
  {
    title: "Свободная структура",
    text: "Меняйте блоки, секции, колонки и композицию страницы."
  },
  {
    title: "Свой визуальный язык",
    text:
      "Создавайте формы, акценты и интерфейс, соответствующие вашему бренду."
  },
  {
    title: "Развитие без переделки с нуля",
    text:
      "Добавляйте новые страницы, товары, сервисы и направления по мере роста."
  }
];

export const businessChangeScenarios: readonly ProjectScenario[] = [
  {
    title: "Новый продукт",
    page: "product-launch",
    detail: "страница запуска"
  },
  {
    title: "Сезонная коллекция",
    page: "summer-drop",
    detail: "подборка товаров"
  },
  {
    title: "Рекламная кампания",
    page: "ads-campaign",
    detail: "лендинг трафика"
  },
  {
    title: "Отдельная аудитория",
    page: "b2b-offer",
    detail: "персональный оффер"
  }
];

export const storeBullets: readonly string[] = [
  "каталог товаров",
  "карточки",
  "варианты",
  "цены",
  "остатки",
  "изображения",
  "доступность"
];

export const productLandingBullets: readonly string[] = [
  "преимущества",
  "история",
  "фотографии",
  "сценарии использования",
  "сравнение",
  "специальное предложение",
  "рекламный трафик"
];

export const infrastructureSteps: readonly InfrastructureStep[] = [
  { label: "Сайт", status: "Уже работает", icon: "01" },
  { label: "Товары", status: "Уже работает", icon: "02" },
  { label: "Склад", status: "Следующий этап", icon: "03" },
  { label: "Касса", status: "Следующий этап", icon: "04" },
  { label: "Доставка", status: "Следующий этап", icon: "05" },
  { label: "Бонусы", status: "Roadmap", icon: "06" },
  { label: "Рассылки", status: "Roadmap", icon: "07" },
  { label: "Аналитика", status: "Roadmap", icon: "08" }
];

export const integrations: readonly IntegrationCard[] = [
  {
    title: "МойСклад",
    status: "В разработке",
    role: "Склад, остатки и товарные данные."
  },
  {
    title: "ЮKassa и СБП",
    status: "Скоро",
    role: "Оплата и быстрые платежи."
  },
  {
    title: "СДЭК",
    status: "Скоро",
    role: "Доставка и пункты выдачи."
  },
  {
    title: "Бонусные программы",
    status: "В разработке",
    role: "Мотивация повторных покупок."
  },
  {
    title: "Email-рассылки",
    status: "В разработке",
    role: "Коммуникации и запуск кампаний."
  },
  {
    title: "Telegram",
    status: "Скоро",
    role: "Быстрые уведомления и диалоги."
  },
  {
    title: "CRM",
    status: "В разработке",
    role: "Единая история клиентов."
  },
  {
    title: "Аналитика",
    status: "В разработке",
    role: "Понимание страниц и продаж."
  },
  {
    title: "Онлайн-касса",
    status: "Скоро",
    role: "Фискализация продаж."
  },
  {
    title: "Программы лояльности",
    status: "В разработке",
    role: "Правила накоплений и привилегий."
  }
];

export const analyticsDirections: readonly string[] = [
  "посещаемость",
  "популярные страницы",
  "просмотры товаров",
  "источники трафика",
  "продажи",
  "средний чек",
  "динамика заказов",
  "остатки",
  "эффективность лендингов",
  "повторные покупки"
];

export const growthStages: readonly AudienceCard[] = [
  {
    title: "Сайт",
    text: "Страницы, контент, бренд."
  },
  {
    title: "Магазин",
    text: "Каталог, товары, цены, остатки."
  },
  {
    title: "Торговая инфраструктура",
    text: "Оплата, склад, доставка, CRM, рассылки."
  },
  {
    title: "Экосистема",
    text:
      "Несколько магазинов, продавцов, каталогов или собственный маркетплейс.",
    badge: "Стратегическое направление"
  }
];

export const mercurioReasons: readonly FeatureCard[] = [
  {
    title: "Свобода",
    text:
      "Создавайте структуру и внешний вид под задачу, а не под ограничения шаблона."
  },
  {
    title: "Простота",
    text: "Управляйте сложной торговой системой через понятные действия."
  },
  {
    title: "Масштабируемость",
    text:
      "Начните с лендинга и постепенно соберите магазин, систему продаж или собственный маркетплейс."
  },
  {
    title: "Связанность",
    text:
      "Сайт, товары, склад, касса, доставка и коммуникации работают как единая инфраструктура."
  }
];

export const capabilityGroups: readonly CapabilityGroup[] = [
  {
    title: "Уже работает",
    items: [
      "проекты",
      "страницы",
      "секции и блоки",
      "изображения",
      "медиабиблиотека",
      "товары",
      "варианты",
      "цены",
      "остатки",
      "публикация",
      "история публикаций",
      "публичный storefront"
    ]
  },
  {
    title: "Следующие этапы",
    items: [
      "корзина",
      "checkout",
      "заказы",
      "оплата",
      "доставка",
      "аналитика",
      "рассылки",
      "бонусные системы",
      "МойСклад"
    ]
  },
  {
    title: "Стратегическое направление",
    items: [
      "marketplace",
      "несколько продавцов",
      "расширенная автоматизация",
      "экосистема интеграций"
    ]
  }
];
