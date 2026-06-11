export const SPECIES_OPTIONS = [
  { value: 'Cow', label: 'Корова' },
  { value: 'Pig', label: 'Свиня' },
  { value: 'Sheep', label: 'Вівця' },
  { value: 'Goat', label: 'Коза' },
  { value: 'Chicken', label: 'Курка' },
  { value: 'Duck', label: 'Качка' },
  { value: 'Goose', label: 'Гуска' },
  { value: 'Turkey', label: 'Індик' },
  { value: 'Rabbit', label: 'Кріль' },
  { value: 'Unknown', label: 'Інше' }
];

export const SEX_OPTIONS = [
  { value: 'Male', label: 'Самець' },
  { value: 'Female', label: 'Самка' },
  { value: 'Unknown', label: 'Невідомо' }
];

export const ANIMAL_STATUS_OPTIONS = [
  { value: 'Growing', label: 'Росте' },
  { value: 'Active', label: 'Активний' },
  { value: 'Sick', label: 'Хворий' },
  { value: 'Slaughtered', label: 'Забито' },
  { value: 'Dead', label: 'Загинув' }
];

export const ANIMAL_PRODUCT_UNIT_OPTIONS = [
  { value: 'Ton', label: 'Тонна (т)' },
  { value: 'Kilogram', label: 'Кілограм (кг)' },
  { value: 'Gram', label: 'Грам (г)' },
  { value: 'Liter', label: 'Літр (л)' },
  { value: 'Milliliter', label: 'Мілілітр (мл)' },
  { value: 'Piece', label: 'Штука (шт)' },
  { value: 'Ares', label: 'Ар (а)' }
];

export function getLabelFromOptions(options: { value: string; label: string }[], value: string): string {
  const matched = options.find(o => o.value === value);
  return matched ? matched.label : value;
}