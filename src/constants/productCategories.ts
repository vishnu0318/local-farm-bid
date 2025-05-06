export interface Category {
  id: string;
  label: string;
}

export interface SubCategory {
  id: string;
  label: string;
  categoryId: string;
}

export const CATEGORIES: Category[] = [
  { id: 'vegetables', label: 'Vegetables' },
  { id: 'fruits', label: 'Fruits' },
  { id: 'grains', label: 'Grains' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'other', label: 'Other' }
];

export const SUBCATEGORIES: SubCategory[] = [
  // Vegetables
  { id: 'tomato', label: 'Tomato', categoryId: 'vegetables' },
  { id: 'potato', label: 'Potato', categoryId: 'vegetables' },
  { id: 'onion', label: 'Onion', categoryId: 'vegetables' },
  { id: 'carrot', label: 'Carrot', categoryId: 'vegetables' },
  { id: 'spinach', label: 'Spinach', categoryId: 'vegetables' },
  { id: 'cabbage', label: 'Cabbage', categoryId: 'vegetables' },
  { id: 'cauliflower', label: 'Cauliflower', categoryId: 'vegetables' },
  { id: 'brinjal', label: 'Brinjal', categoryId: 'vegetables' },
  { id: 'capsicum', label: 'Capsicum', categoryId: 'vegetables' },
  { id: 'peas', label: 'Peas', categoryId: 'vegetables' },
  { id: 'okra', label: 'Okra', categoryId: 'vegetables' },
  { id: 'cucumber', label: 'Cucumber', categoryId: 'vegetables' },

  // Fruits
  { id: 'mango', label: 'Mango', categoryId: 'fruits' },
  { id: 'apple', label: 'Apple', categoryId: 'fruits' },
  { id: 'banana', label: 'Banana', categoryId: 'fruits' },
  { id: 'grapes', label: 'Grapes', categoryId: 'fruits' },
  { id: 'orange', label: 'Orange', categoryId: 'fruits' },
  { id: 'papaya', label: 'Papaya', categoryId: 'fruits' },
  { id: 'watermelon', label: 'Watermelon', categoryId: 'fruits' },
  { id: 'pineapple', label: 'Pineapple', categoryId: 'fruits' },
  { id: 'strawberry', label: 'Strawberry', categoryId: 'fruits' },
  { id: 'guava', label: 'Guava', categoryId: 'fruits' },

  // Grains
  { id: 'rice', label: 'Rice', categoryId: 'grains' },
  { id: 'wheat', label: 'Wheat', categoryId: 'grains' },
  { id: 'barley', label: 'Barley', categoryId: 'grains' },
  { id: 'maize', label: 'Maize', categoryId: 'grains' },
  { id: 'millet', label: 'Millet', categoryId: 'grains' },
  { id: 'oats', label: 'Oats', categoryId: 'grains' },
  { id: 'ragi', label: 'Ragi', categoryId: 'grains' },
  { id: 'jowar', label: 'Jowar', categoryId: 'grains' },

  // Dairy
  { id: 'milk', label: 'Milk', categoryId: 'dairy' },
  { id: 'curd', label: 'Curd', categoryId: 'dairy' },
  { id: 'butter', label: 'Butter', categoryId: 'dairy' },
  { id: 'cheese', label: 'Cheese', categoryId: 'dairy' },
  { id: 'paneer', label: 'Paneer', categoryId: 'dairy' },
  { id: 'ghee', label: 'Ghee', categoryId: 'dairy' },

  // Other
  { id: 'spices', label: 'Spices', categoryId: 'other' },
  { id: 'herbs', label: 'Herbs', categoryId: 'other' },
  { id: 'flowers', label: 'Flowers', categoryId: 'other' },
  { id: 'honey', label: 'Honey', categoryId: 'other' },
  { id: 'eggs', label: 'Eggs', categoryId: 'other' },
  { id: 'nuts', label: 'Nuts', categoryId: 'other' }
];
