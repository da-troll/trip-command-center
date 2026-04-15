export type ModuleId = 'setup' | 'groups' | 'routes' | 'itinerary' | 'meals' | 'expenses' | 'launch'

export interface Waypoint {
  id: string
  label: string
  lat: number
  lng: number
  note?: string
}

export interface Route {
  id: string
  groupId: string
  waypoints: Waypoint[]
  color: string
  label: string
  departureTime?: string
}

export interface Group {
  id: string
  name: string
  color: string
  emoji: string
  members: string[]
  origin?: string
  originLat?: number
  originLng?: number
}

export interface DayBlock {
  id: string
  date: string       // ISO date YYYY-MM-DD
  time?: string      // HH:MM
  title: string
  description?: string
  groupIds: string[] // [] = all groups
  location?: string
  type: 'activity' | 'meal' | 'travel' | 'lodging' | 'free'
}

export interface MealSlot {
  id: string
  date: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  title: string
  assignedGroupIds: string[]
  notes?: string
  cost?: number
}

export interface ExpenseItem {
  id: string
  description: string
  amount: number
  currency: string
  paidBy: string          // group id or 'shared'
  splitBetween: string[]  // group ids
  date: string
  category: 'transport' | 'food' | 'lodging' | 'activity' | 'other'
}

export interface TripSetup {
  name: string
  destination: string
  startDate: string
  endDate: string
  timezone: string
  coverEmoji: string
  description?: string
}

export interface TripState {
  setup: TripSetup
  groups: Group[]
  routes: Route[]
  itinerary: DayBlock[]
  meals: MealSlot[]
  expenses: ExpenseItem[]
  activeModule: ModuleId
}
