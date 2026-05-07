<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { state, addSupplement, updateSupplement, deleteSupplement, uid } from '../store'
import {
  MEAL_SLOTS,
  MEAL_SLOT_LABEL,
  MEAL_SLOT_ICON,
  FOOD_PREFERENCE_LABEL,
  type MealSlot,
  type FoodPreference,
  type Reminder,
  type Supplement
} from '../types'
import {
  notificationsSupported,
  permission,
  requestPermission,
  triggersSupported
} from '../notifications'

defineEmits<{ close: [] }>()

const showForm = ref(state.supplements.length === 0)
const editingId = ref<string | null>(null)
const name = ref('')
const selectedSlots = ref<MealSlot[]>(['breakfast'])
const daysPerWeek = ref(7)
const foodPreference = ref<FoodPreference>('none')
const reminders = ref<Reminder[]>([])
const error = ref('')

const notifSupported = notificationsSupported()
const triggersOk = triggersSupported()
const permState = ref<NotificationPermission>(notifSupported ? permission() : 'denied')
let permPoll: number | null = null

onMounted(() => {
  if (!notifSupported) return
  permPoll = window.setInterval(() => {
    permState.value = permission()
  }, 1500)
})

onUnmounted(() => {
  if (permPoll !== null) clearInterval(permPoll)
})

async function enableNotifications() {
  permState.value = await requestPermission()
}

function toggleSlot(t: MealSlot) {
  const idx = selectedSlots.value.indexOf(t)
  if (idx >= 0) selectedSlots.value.splice(idx, 1)
  else selectedSlots.value.push(t)
}

function addReminder() {
  reminders.value.push({ id: uid(), time: '09:00' })
}

function removeReminder(id: string) {
  const idx = reminders.value.findIndex((r) => r.id === id)
  if (idx >= 0) reminders.value.splice(idx, 1)
}

function reset() {
  editingId.value = null
  name.value = ''
  selectedSlots.value = ['breakfast']
  daysPerWeek.value = 7
  foodPreference.value = 'none'
  reminders.value = []
  error.value = ''
}

function startEdit(s: Supplement) {
  editingId.value = s.id
  name.value = s.name
  selectedSlots.value = [...s.slots]
  daysPerWeek.value = s.daysPerWeek
  foodPreference.value = s.foodPreference
  reminders.value = (s.reminders ?? []).map((r) => ({ ...r }))
  error.value = ''
  showForm.value = true
}

function submit() {
  const trimmed = name.value.trim()
  if (!trimmed) {
    error.value = 'Name is required'
    return
  }
  if (selectedSlots.value.length === 0) {
    error.value = 'Pick at least one meal slot'
    return
  }
  const cleanedReminders = reminders.value
    .filter((r) => /^\d{2}:\d{2}$/.test(r.time))
    .map((r) => ({ id: r.id, time: r.time }))
  const payload = {
    name: trimmed,
    slots: [...selectedSlots.value],
    daysPerWeek: daysPerWeek.value,
    foodPreference: foodPreference.value,
    reminders: cleanedReminders
  }
  if (editingId.value) {
    updateSupplement(editingId.value, payload)
  } else {
    addSupplement(payload)
  }
  reset()
  showForm.value = false
}

function confirmDelete(id: string, supplementName: string) {
  if (confirm(`Delete "${supplementName}"? This will also remove its log history.`)) {
    deleteSupplement(id)
    if (editingId.value === id) {
      reset()
      showForm.value = state.supplements.length === 0
    }
  }
}

function formatReminderList(list: Reminder[]): string {
  return list.map((r) => r.time).sort().join(' · ')
}

const FOOD_OPTIONS: FoodPreference[] = ['none', 'with-food', 'empty-stomach']
</script>

<template>
  <div
    class="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center"
    @click.self="$emit('close')"
  >
    <div
      class="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto"
      style="padding-bottom: env(safe-area-inset-bottom)"
    >
      <header class="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-5 py-4 flex items-center justify-between">
        <h2 class="font-semibold">Manage supplements</h2>
        <button
          class="text-sm text-slate-400 hover:text-slate-200"
          @click="$emit('close')"
        >
          Close
        </button>
      </header>

      <div class="p-5 space-y-5">
        <div
          v-if="notifSupported && permState !== 'granted'"
          class="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-start justify-between gap-3"
        >
          <div class="text-xs text-emerald-100 leading-relaxed">
            <div class="font-medium text-emerald-300">Enable reminders</div>
            <p class="mt-0.5 text-emerald-200/80">
              Allow notifications to get pinged when it's time to take each supplement.
            </p>
            <p v-if="!triggersOk" class="mt-1 text-emerald-200/60">
              Heads-up: this device may only fire reminders while the app is open. For background reminders on Android, install the app and use Chrome.
            </p>
          </div>
          <button
            v-if="permState === 'default'"
            class="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-medium hover:bg-emerald-400"
            @click="enableNotifications"
          >
            Enable
          </button>
          <span
            v-else
            class="shrink-0 text-xs text-amber-300"
            title="Re-enable in your browser site settings"
          >
            Blocked
          </span>
        </div>

        <div
          v-else-if="!notifSupported"
          class="px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700 text-xs text-slate-400"
        >
          Notifications aren't supported in this browser. Reminders won't fire here.
        </div>

        <ul v-if="state.supplements.length > 0" class="space-y-2">
          <li
            v-for="s in state.supplements"
            :key="s.id"
            class="px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 flex items-start justify-between gap-3"
          >
            <div class="min-w-0">
              <div class="font-medium truncate">{{ s.name }}</div>
              <div class="text-xs text-slate-400 mt-1">
                {{ s.slots.map((t) => MEAL_SLOT_LABEL[t]).join(' · ') }} · {{ s.daysPerWeek }}× per week
              </div>
              <div v-if="s.foodPreference !== 'none'" class="text-xs mt-1">
                <span
                  v-if="s.foodPreference === 'with-food'"
                  class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300"
                >
                  🍴 with food
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-500/15 text-sky-300"
                >
                  ∅ empty stomach
                </span>
              </div>
              <div
                v-if="(s.reminders ?? []).length > 0"
                class="text-xs mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300"
              >
                🔔 {{ formatReminderList(s.reminders) }}
              </div>
            </div>
            <div class="flex flex-col items-end gap-1 shrink-0">
              <button
                class="text-sm text-emerald-400 hover:text-emerald-300"
                :class="editingId === s.id ? 'font-semibold' : ''"
                @click="startEdit(s)"
              >
                {{ editingId === s.id ? 'Editing…' : 'Edit' }}
              </button>
              <button
                class="text-sm text-red-400 hover:text-red-300"
                @click="confirmDelete(s.id, s.name)"
              >
                Delete
              </button>
            </div>
          </li>
        </ul>

        <button
          v-if="!showForm"
          class="w-full py-3 rounded-xl border border-dashed border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
          @click="showForm = true"
        >
          + Add supplement
        </button>

        <form
          v-else
          class="space-y-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700"
          @submit.prevent="submit"
        >
          <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {{ editingId ? 'Edit supplement' : 'New supplement' }}
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1.5">Name</label>
            <input
              v-model="name"
              type="text"
              placeholder="e.g. Vitamin D"
              class="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1.5">When to take</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="t in MEAL_SLOTS"
                :key="t"
                type="button"
                class="py-2 px-3 rounded-lg border text-sm font-medium transition-colors flex items-center gap-1.5"
                :class="
                  selectedSlots.includes(t)
                    ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                "
                @click="toggleSlot(t)"
              >
                <span>{{ MEAL_SLOT_ICON[t] }}</span>
                <span>{{ MEAL_SLOT_LABEL[t] }}</span>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1.5">
              Days per week: <span class="text-emerald-400 font-semibold">{{ daysPerWeek }}</span>
            </label>
            <input
              v-model.number="daysPerWeek"
              type="range"
              min="1"
              max="7"
              step="1"
              class="w-full accent-emerald-500"
            />
            <div class="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1.5">Food preference (reminder)</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="opt in FOOD_OPTIONS"
                :key="opt"
                type="button"
                class="py-2 px-2 rounded-lg border text-xs font-medium transition-colors"
                :class="
                  foodPreference === opt
                    ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                "
                @click="foodPreference = opt"
              >
                {{ FOOD_PREFERENCE_LABEL[opt] }}
              </button>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-medium text-slate-300">Reminders</label>
              <button
                type="button"
                class="text-xs text-emerald-400 hover:text-emerald-300"
                @click="addReminder"
              >
                + Add time
              </button>
            </div>
            <p
              v-if="reminders.length === 0"
              class="text-xs text-slate-500"
            >
              No reminders. Add a time to get a daily push notification.
            </p>
            <ul v-else class="space-y-2">
              <li
                v-for="r in reminders"
                :key="r.id"
                class="flex items-center gap-2"
              >
                <input
                  v-model="r.time"
                  type="time"
                  class="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none text-sm"
                />
                <button
                  type="button"
                  class="px-2 py-2 rounded-lg text-red-400 hover:text-red-300 text-sm"
                  @click="removeReminder(r.id)"
                  aria-label="Remove reminder"
                >
                  Remove
                </button>
              </li>
            </ul>
            <p
              v-if="reminders.length > 0 && notifSupported && permState !== 'granted'"
              class="text-[11px] text-amber-300 mt-2"
            >
              Reminders won't fire until you enable notifications above.
            </p>
          </div>

          <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

          <div class="flex gap-2 pt-1">
            <button
              type="button"
              class="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
              @click="
                () => {
                  reset()
                  if (state.supplements.length > 0) showForm = false
                }
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-medium hover:bg-emerald-400 active:bg-emerald-600"
            >
              {{ editingId ? 'Save' : 'Add' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
