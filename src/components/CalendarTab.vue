<script setup lang="ts">
import { computed, ref } from 'vue'
import { state, logsForDay, supplementById, dayKey, startOfDay } from '../store'
import { MEAL_SLOT_LABEL } from '../types'

const today = new Date()
const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth())
const selectedKey = ref(dayKey(today.getTime()))

const monthLabel = computed(() =>
  new Date(viewYear.value, viewMonth.value, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric'
  })
)

interface Cell {
  date: Date | null
  key: string
  count: number
  inFuture: boolean
}

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const cells = computed<Cell[]>(() => {
  const first = new Date(viewYear.value, viewMonth.value, 1)
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  // Monday-first: getDay() returns 0=Sun..6=Sat. Convert to 0=Mon..6=Sun.
  const lead = (first.getDay() + 6) % 7

  const result: Cell[] = []
  for (let i = 0; i < lead; i++) {
    result.push({ date: null, key: `pad-${i}`, count: 0, inFuture: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(viewYear.value, viewMonth.value, d)
    const ts = date.getTime()
    const inFuture = startOfDay(ts) > startOfDay(Date.now())
    result.push({
      date,
      key: dayKey(ts),
      count: logsForDay(ts).length,
      inFuture
    })
  }
  return result
})

function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value -= 1
  } else {
    viewMonth.value -= 1
  }
}

function nextMonth() {
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value += 1
  } else {
    viewMonth.value += 1
  }
}

const selectedTs = computed(() => {
  const [y, m, d] = selectedKey.value.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
})

const selectedLabel = computed(() =>
  new Date(selectedTs.value).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })
)

interface DetailRow {
  logId: string
  name: string
  slot: string
  hhmm: string
}

const selectedDetails = computed<DetailRow[]>(() => {
  const logs = logsForDay(selectedTs.value).slice().sort((a, b) => a.takenAt - b.takenAt)
  return logs.map((l) => {
    const supp = supplementById(l.supplementId)
    const d = new Date(l.takenAt)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return {
      logId: l.id,
      name: supp?.name ?? 'Deleted supplement',
      slot: MEAL_SLOT_LABEL[l.slot],
      hhmm: `${hh}:${mm}`
    }
  })
})

const todayKey = dayKey(today.getTime())
const hasLogs = computed(() => state.logs.length > 0)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <button
        class="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600"
        aria-label="Previous month"
        @click="prevMonth"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <h2 class="font-semibold">{{ monthLabel }}</h2>
      <button
        class="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600"
        aria-label="Next month"
        @click="nextMonth"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>

    <div class="grid grid-cols-7 gap-1 mb-1">
      <div
        v-for="d in weekdayLabels"
        :key="d"
        class="text-center text-xs text-slate-500 font-medium py-1"
      >
        {{ d }}
      </div>
    </div>

    <div class="grid grid-cols-7 gap-1">
      <template v-for="cell in cells" :key="cell.key">
        <div v-if="!cell.date" />
        <button
          v-else
          class="aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors relative"
          :class="[
            cell.key === selectedKey
              ? 'bg-emerald-500 text-white'
              : cell.count > 0
                ? 'bg-emerald-500/15 text-slate-100 hover:bg-emerald-500/25'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800',
            cell.key === todayKey && cell.key !== selectedKey
              ? 'ring-1 ring-emerald-400/60'
              : '',
            cell.inFuture ? 'opacity-50' : ''
          ]"
          @click="selectedKey = cell.key"
        >
          <span>{{ cell.date.getDate() }}</span>
          <span
            v-if="cell.count > 0"
            class="absolute bottom-1 text-[10px] font-semibold"
            :class="cell.key === selectedKey ? 'text-white' : 'text-emerald-400'"
          >
            {{ cell.count }}
          </span>
        </button>
      </template>
    </div>

    <div class="mt-6">
      <h3 class="text-sm font-semibold text-slate-300 mb-3">{{ selectedLabel }}</h3>

      <div v-if="!hasLogs" class="text-sm text-slate-500 italic">
        No supplements logged yet.
      </div>
      <div v-else-if="selectedDetails.length === 0" class="text-sm text-slate-500 italic">
        Nothing logged on this day.
      </div>
      <ul v-else class="space-y-2">
        <li
          v-for="row in selectedDetails"
          :key="row.logId"
          class="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700"
        >
          <div>
            <div class="font-medium">{{ row.name }}</div>
            <div class="text-xs text-slate-400 mt-0.5">{{ row.slot }}</div>
          </div>
          <div class="text-sm text-slate-300 tabular-nums">{{ row.hhmm }}</div>
        </li>
      </ul>
    </div>
  </div>
</template>
