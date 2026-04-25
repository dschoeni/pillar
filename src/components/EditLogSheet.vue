<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { supplementById, updateLog, unlog } from '../store'
import {
  MEAL_SLOTS,
  MEAL_SLOT_LABEL,
  MEAL_SLOT_ICON,
  type LogEntry,
  type MealSlot
} from '../types'

const props = defineProps<{ log: LogEntry }>()
const emit = defineEmits<{ close: [] }>()

const slot = ref<MealSlot>(props.log.slot)
const dateValue = ref('')
const timeValue = ref('')
const error = ref('')

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function fromTimestamp(ts: number) {
  const d = new Date(ts)
  dateValue.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  timeValue.value = `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

watch(
  () => props.log,
  (l) => {
    slot.value = l.slot
    fromTimestamp(l.takenAt)
    error.value = ''
  },
  { immediate: true }
)

const supplementName = computed(() => supplementById(props.log.supplementId)?.name ?? 'Deleted supplement')

function save() {
  if (!dateValue.value || !timeValue.value) {
    error.value = 'Date and time are required'
    return
  }
  const [y, m, d] = dateValue.value.split('-').map(Number)
  const [hh, mm] = timeValue.value.split(':').map(Number)
  const takenAt = new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0).getTime()
  if (Number.isNaN(takenAt)) {
    error.value = 'Invalid date or time'
    return
  }
  updateLog(props.log.id, { slot: slot.value, takenAt })
  emit('close')
}

function confirmDelete() {
  if (confirm('Remove this log entry?')) {
    unlog(props.log.id)
    emit('close')
  }
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto"
      style="padding-bottom: env(safe-area-inset-bottom)"
    >
      <header class="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-5 py-4 flex items-center justify-between">
        <h2 class="font-semibold">Edit log entry</h2>
        <button
          class="text-sm text-slate-400 hover:text-slate-200"
          @click="emit('close')"
        >
          Close
        </button>
      </header>

      <form class="p-5 space-y-4" @submit.prevent="save">
        <div>
          <div class="text-xs font-medium text-slate-300 mb-1.5">Supplement</div>
          <div class="px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-200">
            {{ supplementName }}
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1.5">Meal slot</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="t in MEAL_SLOTS"
              :key="t"
              type="button"
              class="py-2 px-3 rounded-lg border text-sm font-medium transition-colors flex items-center gap-1.5"
              :class="
                slot === t
                  ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
              "
              @click="slot = t"
            >
              <span>{{ MEAL_SLOT_ICON[t] }}</span>
              <span>{{ MEAL_SLOT_LABEL[t] }}</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1.5">Date</label>
            <input
              v-model="dateValue"
              type="date"
              class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1.5">Time</label>
            <input
              v-model="timeValue"
              type="time"
              class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

        <div class="flex gap-2 pt-1">
          <button
            type="button"
            class="flex-1 py-2.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10"
            @click="confirmDelete"
          >
            Delete
          </button>
          <button
            type="submit"
            class="flex-1 py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-medium hover:bg-emerald-400 active:bg-emerald-600"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
