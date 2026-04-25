<script setup lang="ts">
import { computed } from 'vue'
import { state, logIntake, alreadyLoggedToday, unlog } from '../store'
import { MEAL_SLOTS, MEAL_SLOT_LABEL, MEAL_SLOT_ICON, type MealSlot } from '../types'

const today = new Date()
const dateLabel = today.toLocaleDateString(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric'
})

interface Slot {
  slot: MealSlot
  supplements: typeof state.supplements
}

const slots = computed<Slot[]>(() =>
  MEAL_SLOTS.map((slot) => ({
    slot,
    supplements: state.supplements.filter((s) => s.slots.includes(slot))
  })).filter((s) => s.supplements.length > 0)
)

const hasAnything = computed(() => state.supplements.length > 0)

function toggle(supplementId: string, slot: MealSlot) {
  const existing = alreadyLoggedToday(supplementId, slot)
  if (existing) {
    unlog(existing.id)
  } else {
    logIntake(supplementId, slot)
  }
}
</script>

<template>
  <div>
    <p class="text-sm text-slate-400 mb-5">{{ dateLabel }}</p>

    <div v-if="!hasAnything" class="text-center py-16 text-slate-400">
      <p class="mb-2">No supplements yet.</p>
      <p class="text-sm">Tap <span class="text-emerald-400 font-medium">Manage</span> to add some.</p>
    </div>

    <div v-else class="space-y-6">
      <section v-for="entry in slots" :key="entry.slot">
        <h2 class="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
          <span>{{ MEAL_SLOT_ICON[entry.slot] }}</span>
          {{ MEAL_SLOT_LABEL[entry.slot] }}
        </h2>

        <ul class="space-y-2">
          <li v-for="s in entry.supplements" :key="s.id">
            <button
              class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-colors text-left"
              :class="
                alreadyLoggedToday(s.id, entry.slot)
                  ? 'bg-emerald-500/15 border-emerald-500/40'
                  : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 active:bg-slate-700'
              "
              @click="toggle(s.id, entry.slot)"
            >
              <div class="min-w-0">
                <div class="font-medium truncate">{{ s.name }}</div>
                <div class="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>{{ s.daysPerWeek }}× per week</span>
                  <span
                    v-if="s.foodPreference === 'with-food'"
                    class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300"
                  >
                    🍴 with food
                  </span>
                  <span
                    v-else-if="s.foodPreference === 'empty-stomach'"
                    class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-500/15 text-sky-300"
                  >
                    ∅ empty stomach
                  </span>
                </div>
              </div>
              <span
                class="flex items-center justify-center w-7 h-7 rounded-full border-2 shrink-0"
                :class="
                  alreadyLoggedToday(s.id, entry.slot)
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-slate-600'
                "
              >
                <svg
                  v-if="alreadyLoggedToday(s.id, entry.slot)"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            </button>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
