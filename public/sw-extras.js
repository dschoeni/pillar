self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    (async () => {
      const matched = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      })
      for (const client of matched) {
        if ('focus' in client) {
          try {
            await client.focus()
            return
          } catch (_e) {
            // try next client
          }
        }
      }
      if (self.clients.openWindow) {
        const url = self.registration && self.registration.scope ? self.registration.scope : '/'
        await self.clients.openWindow(url)
      }
    })()
  )
})
