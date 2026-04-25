<script setup lang="ts">
import { ref } from 'vue'
import LogTab from './components/LogTab.vue'
import CalendarTab from './components/CalendarTab.vue'
import ManageSheet from './components/ManageSheet.vue'

type Tab = 'log' | 'calendar'
const activeTab = ref<Tab>('log')
const showManage = ref(false)
</script>

<template>
  <div class="flex flex-col h-full max-w-md mx-auto">
    <header class="flex items-center justify-between px-5 pt-6 pb-4">
      <h1 class="text-xl font-semibold tracking-tight">Pillar</h1>
      <button
        class="text-sm text-emerald-400 hover:text-emerald-300 active:text-emerald-200 font-medium"
        @click="showManage = true"
      >
        Manage
      </button>
    </header>

    <main class="flex-1 overflow-y-auto px-5 pb-24">
      <LogTab v-if="activeTab === 'log'" />
      <CalendarTab v-else />
    </main>

    <nav
      class="fixed bottom-0 inset-x-0 max-w-md mx-auto bg-slate-900/95 backdrop-blur border-t border-slate-800"
      style="padding-bottom: env(safe-area-inset-bottom)"
    >
      <div class="grid grid-cols-2">
        <button
          class="py-4 text-sm font-medium transition-colors"
          :class="activeTab === 'log' ? 'text-emerald-400' : 'text-slate-400'"
          @click="activeTab = 'log'"
        >
          <div class="flex flex-col items-center gap-1">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 11l3 3 8-8" />
              <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
            </svg>
            Log
          </div>
        </button>
        <button
          class="py-4 text-sm font-medium transition-colors"
          :class="activeTab === 'calendar' ? 'text-emerald-400' : 'text-slate-400'"
          @click="activeTab = 'calendar'"
        >
          <div class="flex flex-col items-center gap-1">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Calendar
          </div>
        </button>
      </div>
    </nav>

    <ManageSheet v-if="showManage" @close="showManage = false" />
  </div>
</template>
