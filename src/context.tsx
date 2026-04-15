import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import type { TripState, ModuleId, Group, Route, DayBlock, MealSlot, ExpenseItem, TripSetup } from './types'
import { SEED } from './seedData'

type Action =
  | { type: 'SET_MODULE'; module: ModuleId }
  | { type: 'UPDATE_SETUP'; setup: Partial<TripSetup> }
  | { type: 'ADD_GROUP'; group: Group }
  | { type: 'UPDATE_GROUP'; group: Group }
  | { type: 'REMOVE_GROUP'; id: string }
  | { type: 'ADD_ROUTE'; route: Route }
  | { type: 'UPDATE_ROUTE'; route: Route }
  | { type: 'REMOVE_ROUTE'; id: string }
  | { type: 'ADD_DAY_BLOCK'; block: DayBlock }
  | { type: 'UPDATE_DAY_BLOCK'; block: DayBlock }
  | { type: 'REMOVE_DAY_BLOCK'; id: string }
  | { type: 'ADD_MEAL'; meal: MealSlot }
  | { type: 'UPDATE_MEAL'; meal: MealSlot }
  | { type: 'REMOVE_MEAL'; id: string }
  | { type: 'ADD_EXPENSE'; expense: ExpenseItem }
  | { type: 'UPDATE_EXPENSE'; expense: ExpenseItem }
  | { type: 'REMOVE_EXPENSE'; id: string }
  | { type: 'RESET' }

function reducer(state: TripState, action: Action): TripState {
  switch (action.type) {
    case 'SET_MODULE':
      return { ...state, activeModule: action.module }
    case 'UPDATE_SETUP':
      return { ...state, setup: { ...state.setup, ...action.setup } }
    case 'ADD_GROUP':
      return { ...state, groups: [...state.groups, action.group] }
    case 'UPDATE_GROUP':
      return { ...state, groups: state.groups.map(g => g.id === action.group.id ? action.group : g) }
    case 'REMOVE_GROUP':
      return { ...state, groups: state.groups.filter(g => g.id !== action.id) }
    case 'ADD_ROUTE':
      return { ...state, routes: [...state.routes, action.route] }
    case 'UPDATE_ROUTE':
      return { ...state, routes: state.routes.map(r => r.id === action.route.id ? action.route : r) }
    case 'REMOVE_ROUTE':
      return { ...state, routes: state.routes.filter(r => r.id !== action.id) }
    case 'ADD_DAY_BLOCK':
      return { ...state, itinerary: [...state.itinerary, action.block] }
    case 'UPDATE_DAY_BLOCK':
      return { ...state, itinerary: state.itinerary.map(b => b.id === action.block.id ? action.block : b) }
    case 'REMOVE_DAY_BLOCK':
      return { ...state, itinerary: state.itinerary.filter(b => b.id !== action.id) }
    case 'ADD_MEAL':
      return { ...state, meals: [...state.meals, action.meal] }
    case 'UPDATE_MEAL':
      return { ...state, meals: state.meals.map(m => m.id === action.meal.id ? action.meal : m) }
    case 'REMOVE_MEAL':
      return { ...state, meals: state.meals.filter(m => m.id !== action.id) }
    case 'ADD_EXPENSE':
      return { ...state, expenses: [...state.expenses, action.expense] }
    case 'UPDATE_EXPENSE':
      return { ...state, expenses: state.expenses.map(e => e.id === action.expense.id ? action.expense : e) }
    case 'REMOVE_EXPENSE':
      return { ...state, expenses: state.expenses.filter(e => e.id !== action.id) }
    case 'RESET':
      return SEED
    default:
      return state
  }
}

const STORAGE_KEY = 'trip-command-center-v1'

function loadState(): TripState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...SEED, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return SEED
}

interface TripCtx {
  state: TripState
  dispatch: React.Dispatch<Action>
}

const TripContext = createContext<TripCtx | null>(null)

export function TripProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch { /* ignore */ }
  }, [state])

  return <TripContext.Provider value={{ state, dispatch }}>{children}</TripContext.Provider>
}

export function useTrip() {
  const ctx = useContext(TripContext)
  if (!ctx) throw new Error('useTrip must be used inside TripProvider')
  return ctx
}
