cronAdd('sync_attendance_daily', '0 0 * * *', () => {
  const url =
    'https://docs.google.com/spreadsheets/d/1IDlk36sxh14G1vqrl-i8JltLVUjagmWpMiHHoZUgkN8/gviz/tq?tqx=out:csv&sheet=Assist%C3%AAncia%20%C3%A0s%20Reuni%C3%B5es'
  const res = $http.send({ url: url, method: 'GET' })

  if (res.statusCode !== 200) return

  let bytes = res.body
  let csvText = ''
  let i = 0

  while (i < bytes.length) {
    let c = bytes[i++]
    if (c < 0x80) {
      csvText += String.fromCharCode(c)
    } else if (c > 0xbf && c < 0xe0) {
      let c2 = bytes[i++]
      csvText += String.fromCharCode(((c & 0x1f) << 6) | (c2 & 0x3f))
    } else if (c > 0xdf && c < 0xf0) {
      let c2 = bytes[i++]
      let c3 = bytes[i++]
      csvText += String.fromCharCode(((c & 0x0f) << 12) | ((c2 & 0x3f) << 6) | (c3 & 0x3f))
    } else {
      let c2 = bytes[i++]
      let c3 = bytes[i++]
      let c4 = bytes[i++]
      let cp = ((c & 0x07) << 18) | ((c2 & 0x3f) << 12) | ((c3 & 0x3f) << 6) | (c4 & 0x3f)
      cp -= 0x10000
      csvText += String.fromCharCode((cp >> 10) | 0xd800, (cp & 0x3ff) | 0xdc00)
    }
  }

  const rows = csvText.split('\n')
  if (rows.length < 2) return

  const headers = rows[0]
    .replace(/"/g, '')
    .replace(/\r/g, '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
  const dateIdx = headers.findIndex((h) => h === 'data')
  const typeIdx = headers.findIndex((h) => h === 'tipo')
  const inPersonIdx = headers.findIndex((h) => h === 'presenciais')
  const zoomIdx = headers.findIndex((h) => h === 'zoom')

  if (dateIdx === -1 || typeIdx === -1 || inPersonIdx === -1 || zoomIdx === -1) return

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 30)
  cutoffDate.setHours(0, 0, 0, 0)

  const collection = $app.findCollectionByNameOrId('meeting_attendance')

  $app.runInTransaction((txApp) => {
    for (let j = 1; j < rows.length; j++) {
      if (!rows[j].trim()) continue
      const cols = rows[j].replace(/"/g, '').replace(/\r/g, '').split(',')
      if (cols.length < 4) continue

      const dateStr = cols[dateIdx] ? cols[dateIdx].trim() : ''
      const typeStr = cols[typeIdx] ? cols[typeIdx].trim().toLowerCase() : ''
      const inPerson = parseInt(cols[inPersonIdx], 10) || 0
      const zoom = parseInt(cols[zoomIdx], 10) || 0

      if (!dateStr || !['quinta', 'domingo'].includes(typeStr)) continue

      const dateParts = dateStr.split('/')
      if (dateParts.length !== 3) continue

      const rowDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T12:00:00Z`)
      if (isNaN(rowDate.getTime()) || rowDate < cutoffDate) continue

      const isoDateStr = rowDate.toISOString().split('T')[0] + ' 12:00:00.000Z'

      let exists = false
      try {
        const existing = txApp.findFirstRecordByFilter(
          'meeting_attendance',
          'meeting_date >= {:start} && meeting_date <= {:end} && meeting_type = {:type}',
          {
            start: isoDateStr.substring(0, 10) + ' 00:00:00.000Z',
            end: isoDateStr.substring(0, 10) + ' 23:59:59.000Z',
            type: typeStr,
          },
        )
        exists = !!existing
      } catch (_) {}

      if (!exists) {
        const record = new Record(collection)
        record.set('meeting_date', isoDateStr)
        record.set('meeting_type', typeStr)
        record.set('in_person', inPerson)
        record.set('zoom', zoom)
        txApp.save(record)
      }
    }
  })
})
