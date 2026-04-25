import { reactive, watch } from 'vue'
import type { LogEntry, MealSlot, Supplement } from './types'

interface State {
  supplements: Supplement[]
  logs: LogEntry[]
}

const STORAGE_KEY = 'supplements-tracker:v2'

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { supplements: [], logs: [] }
    const parsed = JSON.parse(raw) as Partial<State>
    return {
      supplements: parsed.supplements ?? [],
      logs: parsed.logs ?? []
    }
  } catch {
    return { supplements: [], logs: [] }
  }
}

export const state = reactive<State>(load())

watch(
  state,
  (value) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  },
  { deep: true }
)

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function addSupplement(input: Omit<Supplement, 'id' | 'createdAt'>) {
  state.supplements.push({
    id: uid(),
    createdAt: Date.now(),
    ...input
  })
}

export function updateSupplement(id: string, patch: Partial<Omit<Supplement, 'id' | 'createdAt'>>) {
  const found = state.supplements.find((s) => s.id === id)
  if (!found) return
  Object.assign(found, patch)
}

export function deleteSupplement(id: string) {
  const idx = state.supplements.findIndex((s) => s.id === id)
  if (idx >= 0) state.supplements.splice(idx, 1)
  for (let i = state.logs.length - 1; i >= 0; i--) {
    if (state.logs[i].supplementId === id) state.logs.splice(i, 1)
  }
}

export function logIntake(supplementId: string, slot: MealSlot, takenAt = Date.now()) {
  state.logs.push({
    id: uid(),
    supplementId,
    slot,
    takenAt
  })
}

export function unlog(logId: string) {
  const idx = state.logs.findIndex((l) => l.id === logId)
  if (idx >= 0) state.logs.splice(idx, 1)
}

export function updateLog(id: string, patch: Partial<Pick<LogEntry, 'slot' | 'takenAt'>>) {
  const found = state.logs.find((l) => l.id === id)
  if (!found) return
  Object.assign(found, patch)
}

export function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function dayKey(ts: number): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function logsForDay(ts: number): LogEntry[] {
  const start = startOfDay(ts)
  const end = start + 24 * 60 * 60 * 1000
  return state.logs.filter((l) => l.takenAt >= start && l.takenAt < end)
}

export function alreadyLoggedToday(supplementId: string, slot: MealSlot, ts = Date.now()): LogEntry | undefined {
  return logsForDay(ts).find((l) => l.supplementId === supplementId && l.slot === slot)
}

export function supplementById(id: string): Supplement | undefined {
  return state.supplements.find((s) => s.id === id)
}
