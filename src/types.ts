export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'bedtime' | 'anytime'

export const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'bedtime', 'anytime']

export const MEAL_SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  bedtime: 'Bedtime',
  anytime: 'Anytime'
}

export const MEAL_SLOT_ICON: Record<MealSlot, string> = {
  breakfast: '☕',
  lunch: '🍽️',
  dinner: '🍴',
  bedtime: '🌙',
  anytime: '⏰'
}

export type FoodPreference = 'none' | 'with-food' | 'empty-stomach'

export const FOOD_PREFERENCE_LABEL: Record<FoodPreference, string> = {
  'none': 'No preference',
  'with-food': 'With food',
  'empty-stomach': 'Empty stomach'
}

export interface Supplement {
  id: string
  name: string
  slots: MealSlot[]
  daysPerWeek: number
  foodPreference: FoodPreference
  createdAt: number
}

export interface LogEntry {
  id: string
  supplementId: string
  slot: MealSlot
  takenAt: number
}
