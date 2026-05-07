import { createApp, watch } from 'vue'
import App from './App.vue'
import { state } from './store'
import { ensureScheduled, remindersSupported } from './notifications'
import './style.css'

createApp(App).mount('#app')

if (remindersSupported()) {
  void ensureScheduled()

  let pending: number | null = null
  watch(
    state,
    () => {
      if (pending !== null) clearTimeout(pending)
      pending = window.setTimeout(() => {
        pending = null
        void ensureScheduled()
      }, 400)
    },
    { deep: true }
  )

  window.setInterval(() => {
    void ensureScheduled()
  }, 6 * 60 * 60 * 1000)

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void ensureScheduled()
  })
}
