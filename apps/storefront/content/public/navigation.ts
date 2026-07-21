export type NavigationItem = {
  label: string;
  href: string;
  description?: string;
};

export const primaryNavigation: NavigationItem[] = [
  {
    label: "Products",
    href: "/products",
    description: "Сайты, магазин, коммуникации, автоматизация и аналитика"
  },
  {
    label: "Solutions",
    href: "/solutions",
    description: "Сценарии запуска публичной витрины и продаж"
  },
  {
    label: "Pricing",
    href: "/pricing",
    description: "Тарифы для старта и роста"
  },
  {
    label: "Migration",
    href: "/migration",
    description: "Переезд с разрозненных сервисов"
  },
  {
    label: "Resources",
    href: "/resources",
    description: "Материалы, шаблоны и инструкции"
  }
];

export const footerGroups = [
  {
    title: "Продукты",
    links: [
      { label: "Все продукты", href: "/products" },
      { label: "Конструктор сайтов", href: "/website-builder" },
      { label: "Интернет-магазин", href: "/online-store" },
      { label: "Интеграции", href: "/products/integrations" }
    ]
  },
  {
    title: "Компания",
    links: [
      { label: "Тарифы", href: "/pricing" },
      { label: "Миграция", href: "/migration" },
      { label: "Ресурсы", href: "/resources" }
    ]
  },
  {
    title: "Документы",
    links: [
      { label: "Политика конфиденциальности", href: "/privacy" },
      { label: "Условия использования", href: "/terms" }
    ]
  },
  {
    title: "Действия",
    links: [
      { label: "Login", href: "/login" },
      { label: "Start work", href: "/register" }
    ]
  }
];
