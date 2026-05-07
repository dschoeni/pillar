import { state } from './store'
import type { Supplement } from './types'

const TAG_PREFIX = 'pillar-reminder:'
const SCHEDULE_HORIZON_DAYS = 7

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator
}

export function permission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied'
  return Notification.permission
}

export function triggersSupported(): boolean {
  return notificationsSupported() && typeof (window as unknown as { TimestampTrigger?: unknown }).TimestampTrigger !== 'undefined'
}

export function remindersSupported(): boolean {
  return triggersSupported()
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied'
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.ready
  } catch {
    return null
  }
}

function nextOccurrences(time: string, daysAhead: number): number[] {
  const [hh, mm] = time.split(':').map((n) => parseInt(n, 10))
  if (Number.isNaN(hh) || Number.isNaN(mm)) return []
  const out: number[] = []
  const now = new Date()
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, hh, mm, 0, 0)
    if (d.getTime() > Date.now()) out.push(d.getTime())
  }
  return out
}

function tagFor(supplementId: string, reminderId: string, ts: number): string {
  return `${TAG_PREFIX}${supplementId}:${reminderId}:${ts}`
}

function bodyFor(s: Supplement): string {
  const parts: string[] = []
  if (s.foodPreference === 'with-food') parts.push('Take with food')
  else if (s.foodPreference === 'empty-stomach') parts.push('Take on empty stomach')
  if (s.slots.length > 0) parts.push(s.slots.join(' · '))
  return parts.join(' — ')
}

interface ScheduledNotificationOptions extends NotificationOptions {
  showTrigger?: unknown
}

async function clearScheduled(reg: ServiceWorkerRegistration): Promise<void> {
  try {
    const all = await reg.getNotifications({ includeTriggered: true } as NotificationOptions & { includeTriggered: boolean })
    for (const n of all) {
      if (n.tag && n.tag.startsWith(TAG_PREFIX)) n.close()
    }
  } catch {
    // best effort
  }
}

let isRescheduling = false

export async function rescheduleAll(): Promise<void> {
  if (!remindersSupported() || permission() !== 'granted') return
  if (isRescheduling) return
  isRescheduling = true
  try {
    const reg = await getRegistration()
    if (!reg) return

    await clearScheduled(reg)

    const Trigger = (window as unknown as { TimestampTrigger: new (ts: number) => unknown }).TimestampTrigger

    for (const s of state.supplements) {
      const reminders = s.reminders ?? []
      for (const r of reminders) {
        const occurrences = nextOccurrences(r.time, SCHEDULE_HORIZON_DAYS)
        for (const ts of occurrences) {
          const options: ScheduledNotificationOptions = {
            body: bodyFor(s),
            tag: tagFor(s.id, r.id, ts),
            icon: 'icon-192.svg',
            badge: 'icon-192.svg',
            showTrigger: new Trigger(ts),
            data: { supplementId: s.id, reminderId: r.id, scheduledFor: ts }
          }
          try {
            await reg.showNotification(`Time to take ${s.name}`, options as NotificationOptions)
          } catch {
            // skip individual failures
          }
        }
      }
    }
  } finally {
    isRescheduling = false
  }
}

export async function ensureScheduled(): Promise<void> {
  if (!remindersSupported() || permission() !== 'granted') return
  await rescheduleAll()
}
