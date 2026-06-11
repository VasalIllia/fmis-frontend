export const FINANCE_MODULE_OPTIONS = [
  { value: 'Manual', label: 'Вручну / Загальне' },
  { value: 'Animals', label: 'Тваринництво' },
  { value: 'Crops', label: 'Рослинництво (поля)' },
  { value: 'Gardens', label: 'Садівництво' },
  { value: 'Unknown', label: 'Інше' }
];

export const FINANCE_TYPE_OPTIONS = [
  { value: 'ProductSale', label: 'Продаж продукції', kind: 'Income' },
  { value: 'OtherIncome', label: 'Інші доходи', kind: 'Income' },
  { value: 'Feed', label: 'Купівля кормів', kind: 'Expense' },
  { value: 'Veterinary', label: 'Ветеринарні препарати / огляди', kind: 'Expense' },
  { value: 'Seeds', label: 'Насіння / Саджанці', kind: 'Expense' },
  { value: 'Fertilizer', label: 'Добрива', kind: 'Expense' },
  { value: 'PlantProtection', label: 'Захист рослин', kind: 'Expense' },
  { value: 'Irrigation', label: 'Витрати на полив', kind: 'Expense' },
  { value: 'Equipment', label: 'Обладнання / Машини', kind: 'Expense' },
  { value: 'Labor', label: 'Оплата праці', kind: 'Expense' },
  { value: 'Maintenance', label: 'Утримання господарства', kind: 'Expense' },
  { value: 'OtherExpense', label: 'Інші витрати', kind: 'Expense' }
];

export const PLANNING_SOURCE_OPTIONS = [
  { value: 'Manual', label: 'Вручну' },
  { value: 'AnimalMating', label: 'Злука / Спарювання' },
  { value: 'Crop', label: 'Рослинництво' },
  { value: 'Garden', label: 'Садівництво' },
  { value: 'Financial', label: 'Фінансова операція' },
  { value: 'AnimalMedicalRecord', label: 'Ветеринарний огляд' }
];