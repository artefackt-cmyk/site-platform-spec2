export type ProductStatus = "ready" | "announced";

export type PublicCard = {
  title: string;
  description: string;
};

export type Product = {
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  status: ProductStatus;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  badge: string;
  featureTitle: string;
  futureSummary: string;
  features: PublicCard[];
  scenarioTitle: string;
  scenarios: PublicCard[];
  process: string[];
  finalCtaTitle: string;
  finalCtaDescription: string;
  finalPrimaryLabel: string;
  finalSecondaryLabel: string;
};

const announcedDefaults = {
  status: "announced" as const,
  primaryCtaLabel: "Оставить заявку",
  secondaryCtaLabel: "Вернуться в каталог",
  secondaryCtaHref: "/products",
  badge: "В разработке",
  featureTitle: "Будущие возможности",
  scenarioTitle: "Сценарии запуска",
  scenarios: [
    {
      title: "Пилотный запуск",
      description: "Опишите текущий процесс, чтобы команда Mercurio подготовила модуль под ваш сценарий."
    },
    {
      title: "Переход без разрыва",
      description: "Сохраните публичную витрину и подключите новый продукт, когда он будет готов."
    }
  ],
  process: ["Обсудить задачу", "Собрать пилотный контур", "Подключить модуль к публичной системе"],
  finalCtaTitle: "Подготовим продукт под ваш сценарий",
  finalCtaDescription:
    "Расскажите, какой процесс нужно закрыть, и мы вернёмся с вариантом запуска.",
  finalPrimaryLabel: "Оставить заявку",
  finalSecondaryLabel: "Посмотреть тарифы"
};

export const products: Product[] = [
  {
    slug: "website-builder",
    name: "Конструктор сайтов",
    eyebrow: "Website Builder",
    description:
      "Собирайте публичные страницы, продуктовые блоки, формы и SEO-структуру в единой системе Mercurio.",
    status: "ready",
    primaryCtaLabel: "Начать работу",
    secondaryCtaLabel: "Посмотреть шаблоны",
    secondaryCtaHref: "/templates",
    badge: "Готов к запуску",
    featureTitle: "Сайт как управляемая система",
    futureSummary:
      "Конструктор помогает быстро выпустить аккуратную публичную витрину и не потерять её связь с продажами.",
    features: [
      {
        title: "Компонентные секции",
        description: "Hero, карточки, CTA, сценарии и формы собираются из единой библиотеки."
      },
      {
        title: "SEO-страницы",
        description: "Уникальные метаданные, sitemap и понятные адреса для публичного трафика."
      },
      {
        title: "Формы заявок",
        description: "Лиды сразу попадают в рабочий поток, а не остаются в отдельной таблице."
      }
    ],
    scenarioTitle: "Когда начинать с конструктора",
    scenarios: [
      {
        title: "Новый запуск",
        description: "Нужна первая аккуратная витрина с продуктом, заявками и понятной структурой."
      },
      {
        title: "Переупаковка",
        description: "Сайт устарел, а команда хочет обновить подачу без разрыва с продажами."
      },
      {
        title: "Рост контента",
        description: "Появляются новые страницы, продукты и сценарии, которые нужно поддерживать централизованно."
      }
    ],
    process: ["Выберите структуру", "Соберите секции", "Опубликуйте и подключите заявки"],
    finalCtaTitle: "Запустите сайт, который можно развивать",
    finalCtaDescription:
      "Начните с публичной витрины и добавляйте магазин, коммуникации и аналитику по мере роста.",
    finalPrimaryLabel: "Начать работу",
    finalSecondaryLabel: "Посмотреть тарифы"
  },
  {
    slug: "online-store",
    name: "Интернет-магазин",
    eyebrow: "Online Store",
    description:
      "Публикуйте каталог, принимайте заказы и помогайте клиенту пройти путь от интереса до покупки.",
    status: "ready",
    primaryCtaLabel: "Начать работу",
    secondaryCtaLabel: "Посмотреть возможности",
    secondaryCtaHref: "#features",
    badge: "Готов к запуску",
    featureTitle: "Продажи поверх публичной витрины",
    futureSummary:
      "Интернет-магазин Mercurio соединяет каталог, заказы, коммуникации и стоимость запуска в одном процессе.",
    features: [
      {
        title: "Каталог и карточки",
        description: "Покажите товары, услуги, пакеты и коллекции без отдельного движка."
      },
      {
        title: "Заказы и заявки",
        description: "Клиент оставляет запрос, а команда сразу видит его в рабочем контуре."
      },
      {
        title: "Расчёт стоимости",
        description: "Соберите понятный путь до цены, заявки или консультации."
      }
    ],
    scenarioTitle: "Для каких продаж подходит",
    scenarios: [
      {
        title: "Каталог услуг",
        description: "Упакуйте предложения в понятные карточки и ведите клиента к заявке."
      },
      {
        title: "Товары и наборы",
        description: "Покажите ассортимент, статусы и варианты покупки на публичной странице."
      },
      {
        title: "Консультационные продажи",
        description: "Соберите предварительный запрос и передайте его менеджеру с контекстом."
      }
    ],
    process: ["Соберите каталог", "Настройте путь заказа", "Запустите продажи"],
    finalCtaTitle: "Запустите продажи",
    finalCtaDescription:
      "Начните с каталога и заявок, затем подключайте оплату, лояльность и аналитику.",
    finalPrimaryLabel: "Начать работу",
    finalSecondaryLabel: "Рассчитать стоимость"
  },
  {
    slug: "orders-payments",
    name: "Заказы и оплаты",
    eyebrow: "Orders & Payments",
    description: "Модуль для оформления заказов, статусов, оплат и уведомлений клиента.",
    ...announcedDefaults,
    futureSummary: "Будущий модуль закроет путь заказа от корзины до оплаты и статуса.",
    features: [
      { title: "Статусы заказов", description: "Единая лента обработки заказов и изменений." },
      { title: "Оплаты", description: "Подключение платёжных сценариев после согласования." },
      { title: "Уведомления", description: "Сообщения клиенту о ключевых шагах заказа." }
    ]
  },
  {
    slug: "customers-loyalty",
    name: "Клиенты и лояльность",
    eyebrow: "Customers & Loyalty",
    description: "Клиентская база, повторные покупки и программы удержания.",
    ...announcedDefaults,
    futureSummary: "Будущий продукт поможет видеть историю клиентов и возвращать их в продажи.",
    features: [
      { title: "Профили клиентов", description: "Контакты, интересы и история обращений." },
      { title: "Сегменты", description: "Группы клиентов по поведению и ценности." },
      { title: "Лояльность", description: "Бонусы, статусы и персональные предложения." }
    ]
  },
  {
    slug: "marketing",
    name: "Маркетинг",
    eyebrow: "Marketing",
    description: "Кампании, аудитории и связка публичных страниц с воронкой продаж.",
    ...announcedDefaults,
    futureSummary: "Маркетинговый модуль соберёт кампании, аудитории и результаты в один обзор.",
    features: [
      { title: "Кампании", description: "Планирование активностей вокруг публичных страниц." },
      { title: "Аудитории", description: "Сегменты для сообщений и предложений." },
      { title: "Результаты", description: "Понимание, какие действия приводят к заявкам." }
    ]
  },
  {
    slug: "advertising",
    name: "Реклама",
    eyebrow: "Advertising",
    description: "Планирование рекламных запусков и контроль связки объявления с посадочной страницей.",
    ...announcedDefaults,
    futureSummary: "Рекламный модуль поможет согласовывать объявления, страницы и лиды.",
    features: [
      { title: "Посадочные страницы", description: "Связка оффера, аудитории и CTA." },
      { title: "UTM-контроль", description: "Подготовка источников и кампаний." },
      { title: "Отчётность", description: "Видимость результатов рекламных запусков." }
    ]
  },
  {
    slug: "social-media",
    name: "Социальные сети",
    eyebrow: "Social Media",
    description: "Контент, публикации и переходы из социальных каналов в публичную витрину.",
    ...announcedDefaults,
    futureSummary: "Модуль соцсетей соединит контент-план с продуктами и заявками.",
    features: [
      { title: "Контент-план", description: "Публикации, темы и статусы подготовки." },
      { title: "Переходы", description: "Связка постов с страницами Mercurio." },
      { title: "Диалоги", description: "Передача интереса клиента в коммуникации." }
    ]
  },
  {
    slug: "automatic-funnels",
    name: "Автоматические воронки",
    eyebrow: "Automatic Funnels",
    description: "Автоматизация шагов от первого касания до заявки или покупки.",
    ...announcedDefaults,
    futureSummary: "Автоматические воронки помогут вести клиента без ручной сборки каждого шага.",
    features: [
      { title: "Условия", description: "Правила перехода между шагами." },
      { title: "Сценарии", description: "Цепочки сообщений, CTA и задач." },
      { title: "Контроль", description: "Понимание, где клиент остановился." }
    ]
  },
  {
    slug: "sales-communications",
    name: "Продажи и коммуникации",
    eyebrow: "Sales Communications",
    description: "Обработка заявок, диалоги, хэнд-офф и контекст для менеджера.",
    ...announcedDefaults,
    futureSummary: "Коммуникационный модуль соберёт обращения из публичных точек в один поток.",
    features: [
      { title: "Диалоги", description: "Единое место для обращений и ответов." },
      { title: "Хэнд-офф", description: "Передача сложных запросов человеку." },
      { title: "Контекст", description: "Продукт, источник и история клиента рядом с диалогом." }
    ]
  },
  {
    slug: "bots",
    name: "Боты",
    eyebrow: "Bots",
    description: "Автоматические помощники для первичных вопросов, квалификации и передачи в команду.",
    ...announcedDefaults,
    futureSummary: "Боты помогут отвечать на частые вопросы и готовить обращения к передаче.",
    features: [
      { title: "FAQ", description: "Ответы на повторяющиеся вопросы клиента." },
      { title: "Квалификация", description: "Сбор вводных перед разговором с менеджером." },
      { title: "Передача", description: "Аккуратный переход от бота к человеку." }
    ]
  },
  {
    slug: "analytics",
    name: "Аналитика",
    eyebrow: "Analytics",
    description: "Показатели публичного сайта, заявок, продуктов и продаж.",
    ...announcedDefaults,
    futureSummary: "Аналитика покажет, как публичный контур превращает интерес в результат.",
    features: [
      { title: "Метрики сайта", description: "Просмотры, конверсии и активность страниц." },
      { title: "Воронка", description: "Путь клиента от визита до заявки." },
      { title: "Продукты", description: "Понимание, какие предложения работают лучше." }
    ]
  },
  {
    slug: "team-roles",
    name: "Команда и роли",
    eyebrow: "Team & Roles",
    description: "Роли, доступы и зоны ответственности для публичного контура.",
    ...announcedDefaults,
    futureSummary: "Модуль ролей поможет разделить работу редакторов, продаж и руководителей.",
    features: [
      { title: "Роли", description: "Права для редакторов, менеджеров и администраторов." },
      { title: "Задачи", description: "Понятная ответственность за публикации и заявки." },
      { title: "Контроль", description: "История действий и безопасные изменения." }
    ]
  },
  {
    slug: "integrations",
    name: "Интеграции",
    eyebrow: "Integrations",
    description: "Связь Mercurio с внешними сервисами, каналами и рабочими процессами.",
    ...announcedDefaults,
    futureSummary: "Интеграции подключат внешний стек без потери публичной структуры Mercurio.",
    features: [
      { title: "Каналы", description: "Подключение источников обращений и трафика." },
      { title: "Сервисы", description: "Обмен данными с рабочими инструментами." },
      { title: "События", description: "Триггеры для процессов продаж и поддержки." }
    ]
  }
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export const featuredProducts = products.filter((product) => product.status === "ready");
