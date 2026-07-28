export type RootCategorySeed = {
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
};

export type SubCategorySeed = {
  name: string;
  slug: string;
  icon: string;
};

export const ROOT_CATEGORIES: RootCategorySeed[] = [
  { name: "Транспорт", slug: "transport", icon: "car", sortOrder: 1 },
  { name: "Недвижимость", slug: "real-estate", icon: "building", sortOrder: 2 },
  { name: "Работа", slug: "jobs", icon: "briefcase", sortOrder: 3 },
  { name: "Услуги", slug: "services", icon: "wrench", sortOrder: 4 },
  { name: "Личные вещи", slug: "personal-items", icon: "shirt", sortOrder: 5 },
  { name: "Для дома и дачи", slug: "home-garden", icon: "home", sortOrder: 6 },
  { name: "Бытовая электроника", slug: "electronics", icon: "smartphone", sortOrder: 7 },
  { name: "Хобби и отдых", slug: "hobbies", icon: "bike", sortOrder: 8 },
  { name: "Животные", slug: "animals", icon: "paw", sortOrder: 9 },
  { name: "Для бизнеса", slug: "business", icon: "factory", sortOrder: 10 },
];

export const SUBCATEGORIES: Record<string, SubCategorySeed[]> = {
  transport: [
    { name: "Автомобили", slug: "cars", icon: "car-front" },
    { name: "Мотоциклы и мототехника", slug: "motorcycles", icon: "bike-moto" },
    { name: "Грузовики и спецтехника", slug: "trucks-special", icon: "truck" },
    { name: "Водный транспорт", slug: "water-transport", icon: "ship" },
    { name: "Запчасти и аксессуары", slug: "parts", icon: "cog" },
    { name: "Прицепы", slug: "trailers", icon: "trailer" },
    { name: "Коммерческий транспорт", slug: "commercial-transport", icon: "bus" },
  ],
  "real-estate": [
    { name: "Квартиры", slug: "apartments", icon: "building-2" },
    { name: "Комнаты", slug: "rooms", icon: "door-open" },
    { name: "Дома, дачи, коттеджи", slug: "houses", icon: "house-plus" },
    { name: "Земельные участки", slug: "land-plots", icon: "map" },
    { name: "Гаражи и машиноместа", slug: "garages-parking", icon: "warehouse" },
    { name: "Коммерческая недвижимость", slug: "commercial", icon: "landmark" },
    { name: "Недвижимость за рубежом", slug: "foreign-realty", icon: "globe" },
  ],
  jobs: [
    { name: "IT, интернет, телеком", slug: "it", icon: "code" },
    { name: "Продажи", slug: "sales", icon: "badge-percent" },
    { name: "Транспорт, логистика", slug: "logistics", icon: "package" },
    { name: "Строительство", slug: "construction-jobs", icon: "hard-hat" },
    { name: "Производство", slug: "production-jobs", icon: "hammer" },
    { name: "Админ. работа", slug: "office-jobs", icon: "clipboard-list" },
    { name: "Красота, фитнес", slug: "beauty-jobs", icon: "sparkles" },
    { name: "Медицина, фармацевтика", slug: "medicine-jobs", icon: "cross" },
  ],
  services: [
    { name: "Ремонт и строительство", slug: "repair", icon: "paint-roller" },
    { name: "Обучение и курсы", slug: "education", icon: "graduation-cap" },
    { name: "Перевозки и курьеры", slug: "moving", icon: "package-check" },
    { name: "Деловые услуги", slug: "business-services", icon: "file-text" },
    { name: "Красота и здоровье", slug: "beauty-services", icon: "heart" },
    { name: "Бытовые услуги", slug: "household-services", icon: "sofa" },
    { name: "Праздники, мероприятия", slug: "event-services", icon: "party-popper" },
    { name: "Аренда оборудования", slug: "equipment-rent", icon: "drill" },
  ],
  "personal-items": [
    { name: "Женская одежда", slug: "women-clothes", icon: "shirt" },
    { name: "Мужская одежда", slug: "men-clothes", icon: "shirt" },
    { name: "Обувь", slug: "shoes", icon: "footprints" },
    { name: "Аксессуары", slug: "accessories", icon: "gem" },
    { name: "Часы и украшения", slug: "watches-jewelry", icon: "watch" },
    { name: "Детская одежда и обувь", slug: "kids-clothes", icon: "baby" },
    { name: "Товары для детей и игрушки", slug: "kids-toys", icon: "toy-brick" },
    { name: "Красота и здоровье", slug: "beauty-products", icon: "sprout" },
  ],
  "home-garden": [
    { name: "Мебель и интерьер", slug: "furniture", icon: "lamp" },
    { name: "Бытовая техника", slug: "appliances", icon: "washing-machine" },
    { name: "Ремонт и строительство", slug: "construction-materials", icon: "ruler" },
    { name: "Посуда и товары для кухни", slug: "kitchenware", icon: "utensils" },
    { name: "Продукты питания", slug: "food-products", icon: "apple" },
    { name: "Растения", slug: "plants", icon: "leaf" },
    { name: "Предметы интерьера, искусство", slug: "interior", icon: "palette" },
  ],
  electronics: [
    { name: "Телефоны", slug: "smartphones", icon: "smartphone" },
    { name: "Ноутбуки", slug: "laptops", icon: "laptop" },
    { name: "Аудио и видео", slug: "tv-audio", icon: "monitor-play" },
    { name: "Товары для компьютера", slug: "pc-parts", icon: "cpu" },
    { name: "Игры, приставки и программы", slug: "games-consoles", icon: "gamepad-2" },
    { name: "Фототехника", slug: "photo", icon: "camera" },
    { name: "Оргтехника и расходники", slug: "office-electronics", icon: "printer" },
    { name: "Планшеты и эл. книги", slug: "tablets-ebooks", icon: "tablet" },
  ],
  hobbies: [
    { name: "Билеты и путешествия", slug: "tickets-travel", icon: "ticket" },
    { name: "Велосипеды", slug: "bicycles", icon: "bike" },
    { name: "Книги и журналы", slug: "books", icon: "book-open" },
    { name: "Коллекционирование", slug: "collecting", icon: "coins" },
    { name: "Музыкальные инструменты", slug: "music-instruments", icon: "music" },
    { name: "Охота и рыбалка", slug: "hunting-fishing", icon: "fish" },
    { name: "Спорт и отдых", slug: "sports", icon: "dumbbell" },
  ],
  animals: [
    { name: "Собаки", slug: "dogs", icon: "dog" },
    { name: "Кошки", slug: "cats", icon: "cat" },
    { name: "Птицы", slug: "birds", icon: "bird" },
    { name: "Аквариум", slug: "aquarium", icon: "fish" },
    { name: "Другие животные", slug: "other-animals", icon: "rabbit" },
    { name: "Товары для животных", slug: "pet-products", icon: "bone" },
  ],
  business: [
    { name: "Готовый бизнес", slug: "ready-business", icon: "briefcasebiz" },
    { name: "Оборудование для бизнеса", slug: "business-equipment", icon: "factory" },
  ],
};
