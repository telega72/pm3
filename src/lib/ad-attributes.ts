export type AttributeField = {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  options?: string[];
};

const BASE: AttributeField[] = [
  { key: "brand", label: "Марка", type: "text" },
  { key: "model", label: "Модель", type: "text" },
  { key: "year", label: "Год выпуска", type: "number" },
  { key: "condition", label: "Состояние", type: "select", options: ["Новое", "Б/у"] },
];

export const ATTRIBUTE_BY_SUBSLUG: Record<string, AttributeField[]> = {
  cars: [
    { key: "brand", label: "Марка", type: "text" },
    { key: "model", label: "Модель", type: "text" },
    { key: "generation", label: "Поколение", type: "text" },
    { key: "year", label: "Год выпуска", type: "number" },
    { key: "mileage", label: "Пробег, км", type: "number" },
    { key: "bodyType", label: "Тип кузова", type: "select", options: ["Седан", "Хэтчбек", "SUV", "Универсал", "Купе", "Минивэн"] },
    { key: "engineVolume", label: "Объем двигателя", type: "text" },
    { key: "fuel", label: "Топливо", type: "select", options: ["Бензин", "Дизель", "Гибрид", "Электро"] },
    { key: "transmission", label: "КПП", type: "select", options: ["Механика", "Автомат", "Робот", "Вариатор"] },
    { key: "drive", label: "Привод", type: "select", options: ["Передний", "Задний", "Полный"] },
    { key: "owners", label: "Владельцев по ПТС", type: "number" },
    { key: "vin", label: "VIN", type: "text" },
  ],
  motorcycles: [
    { key: "brand", label: "Марка", type: "text" },
    { key: "model", label: "Модель", type: "text" },
    { key: "year", label: "Год", type: "number" },
    { key: "engine", label: "Объем двигателя", type: "text" },
    { key: "mileage", label: "Пробег", type: "number" },
    { key: "condition", label: "Состояние", type: "select", options: ["Новое", "Б/у"] },
  ],
  parts: [
    { key: "partType", label: "Тип запчасти", type: "text" },
    { key: "brand", label: "Марка авто", type: "text" },
    { key: "model", label: "Модель авто", type: "text" },
    { key: "oem", label: "OEM номер", type: "text" },
    { key: "condition", label: "Состояние", type: "select", options: ["Новое", "Б/у"] },
  ],
  apartments: [
    { key: "rooms", label: "Комнат", type: "number" },
    { key: "area", label: "Площадь, м²", type: "number" },
    { key: "kitchenArea", label: "Площадь кухни, м²", type: "number" },
    { key: "floor", label: "Этаж", type: "number" },
    { key: "floorsTotal", label: "Этажей в доме", type: "number" },
    { key: "renovation", label: "Ремонт", type: "select", options: ["Без ремонта", "Косметический", "Евроремонт", "Дизайнерский"] },
    { key: "houseType", label: "Тип дома", type: "select", options: ["Кирпичный", "Панельный", "Монолитный"] },
  ],
  houses: [
    { key: "houseArea", label: "Площадь дома, м²", type: "number" },
    { key: "landArea", label: "Площадь участка, сот.", type: "number" },
    { key: "floors", label: "Этажей", type: "number" },
    { key: "material", label: "Материал", type: "select", options: ["Кирпич", "Дерево", "Газоблок", "Каркас"] },
  ],
  commercial: [
    { key: "purpose", label: "Назначение", type: "text" },
    { key: "area", label: "Площадь, м²", type: "number" },
    { key: "floor", label: "Этаж", type: "number" },
  ],
  smartphones: [
    { key: "brand", label: "Бренд", type: "text" },
    { key: "model", label: "Модель", type: "text" },
    { key: "storage", label: "Память", type: "select", options: ["64 ГБ", "128 ГБ", "256 ГБ", "512 ГБ", "1 ТБ"] },
    { key: "color", label: "Цвет", type: "text" },
    { key: "condition", label: "Состояние", type: "select", options: ["Новое", "Б/у"] },
  ],
  laptops: [
    { key: "brand", label: "Бренд", type: "text" },
    { key: "model", label: "Модель", type: "text" },
    { key: "cpu", label: "Процессор", type: "text" },
    { key: "ram", label: "ОЗУ", type: "text" },
    { key: "storage", label: "Накопитель", type: "text" },
    { key: "gpu", label: "Видеокарта", type: "text" },
    { key: "condition", label: "Состояние", type: "select", options: ["Новое", "Б/у"] },
  ],
  "tv-audio": [
    { key: "type", label: "Тип устройства", type: "select", options: ["Телевизор", "Саундбар", "Колонки", "Усилитель"] },
    { key: "brand", label: "Бренд", type: "text" },
    { key: "screen", label: "Диагональ/модель", type: "text" },
    { key: "condition", label: "Состояние", type: "select", options: ["Новое", "Б/у"] },
  ],
  furniture: [
    { key: "furnitureType", label: "Тип мебели", type: "text" },
    { key: "material", label: "Материал", type: "text" },
    { key: "condition", label: "Состояние", type: "select", options: ["Новое", "Б/у"] },
  ],
  appliances: [
    { key: "applianceType", label: "Тип техники", type: "text" },
    { key: "brand", label: "Бренд", type: "text" },
    { key: "energyClass", label: "Энергокласс", type: "text" },
    { key: "condition", label: "Состояние", type: "select", options: ["Новое", "Б/у"] },
  ],
  interior: [
    { key: "itemType", label: "Тип товара", type: "text" },
    { key: "style", label: "Стиль", type: "text" },
    { key: "condition", label: "Состояние", type: "select", options: ["Новое", "Б/у"] },
  ],
  it: [
    { key: "employment", label: "Тип занятости", type: "select", options: ["Полная", "Частичная", "Проектная", "Стажировка"] },
    { key: "schedule", label: "График", type: "select", options: ["Полный день", "Гибкий", "Удаленно", "Сменный"] },
    { key: "experience", label: "Опыт", type: "select", options: ["Без опыта", "1-3 года", "3-6 лет", "6+ лет"] },
  ],
  sales: [
    { key: "employment", label: "Тип занятости", type: "select", options: ["Полная", "Частичная"] },
    { key: "experience", label: "Опыт", type: "select", options: ["Без опыта", "1-3 года", "3+ лет"] },
  ],
  logistics: [
    { key: "employment", label: "Тип занятости", type: "select", options: ["Полная", "Частичная", "Вахта"] },
    { key: "license", label: "Права", type: "select", options: ["B", "C", "E", "Не требуется"] },
  ],
  repair: [{ key: "serviceType", label: "Тип услуги", type: "text" }, { key: "experience", label: "Опыт, лет", type: "number" }],
  education: [{ key: "subject", label: "Предмет", type: "text" }, { key: "format", label: "Формат", type: "select", options: ["Онлайн", "Очно", "Смешанный"] }],
  moving: [{ key: "transportType", label: "Транспорт", type: "text" }, { key: "workers", label: "Грузчики", type: "number" }],
};

export function getAttributesForSlug(subSlug: string | undefined) {
  if (!subSlug) return BASE;
  return ATTRIBUTE_BY_SUBSLUG[subSlug] ?? BASE;
}
