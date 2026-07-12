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

export const businessChangeScenarios: readonly string[] = [
  "Новый продукт",
  "Сезонная коллекция",
  "Рекламная кампания",
  "Специальное предложение",
  "Отдельная аудитория",
  "Обновление бренда"
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

export const infrastructureSteps: readonly string[] = [
  "Запусти сайт",
  "Добавь товары",
  "Подключи склад",
  "Подключи кассу",
  "Настрой доставку",
  "Добавь бонусную систему",
  "Запусти рассылки",
  "Следи за результатами"
];

export const integrations: readonly IntegrationCard[] = [
  { title: "МойСклад", status: "В разработке" },
  { title: "ЮKassa и СБП", status: "Скоро" },
  { title: "СДЭК", status: "Скоро" },
  { title: "Бонусные программы", status: "В разработке" },
  { title: "Email-рассылки", status: "В разработке" },
  { title: "Telegram", status: "Скоро" },
  { title: "CRM", status: "В разработке" },
  { title: "Аналитика", status: "В разработке" },
  { title: "Онлайн-касса", status: "Скоро" },
  { title: "Программы лояльности", status: "В разработке" }
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
