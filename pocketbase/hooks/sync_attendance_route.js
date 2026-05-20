routerAdd(
  'POST',
  '/backend/v1/sync-attendance',
  (e) => {
    const authRole = e.auth?.getString('role')
    if (authRole !== 'Secretário') {
      return e.forbiddenError('Apenas o Secretário pode sincronizar')
    }

    try {
      const url =
        'https://docs.google.com/spreadsheets/d/1IDlk36sxh14G1vqrl-i8JltLVUjagmWpMiHHoZUgkN8/gviz/tq?tqx=out:csv&sheet=Assist%C3%AAncia%20%C3%A0s%20Reuni%C3%B5es'
      const res = $http.send({ url: url, method: 'GET' })

      if (res.statusCode !== 200) {
        return e.badRequestError(
          'Falha ao buscar dados do Google Sheets. A planilha pode estar indisponível.',
        )
      }

      const bytes = res.body
      let csvText = ''
      let i = 0

      while (i < bytes.length) {
        const c = bytes[i++]
        if (c < 0x80) {
          csvText += String.fromCharCode(c)
        } else if (c > 0xbf && c < 0xe0) {
          const c2 = bytes[i++]
          csvText += String.fromCharCode(((c & 0x1f) << 6) | (c2 & 0x3f))
        } else if (c > 0xdf && c < 0xf0) {
          const c2 = bytes[i++]
          const c3 = bytes[i++]
          csvText += String.fromCharCode(((c & 0x0f) << 12) | ((c2 & 0x3f) << 6) | (c3 & 0x3f))
        } else {
          const c2 = bytes[i++]
          const c3 = bytes[i++]
          const c4 = bytes[i++]
          let cp = ((c & 0x07) << 18) | ((c2 & 0x3f) << 12) | ((c3 & 0x3f) << 6) | (c4 & 0x3f)
          cp -= 0x10000
          csvText += String.fromCharCode((cp >> 10) | 0xd800, (cp & 0x3ff) | 0xdc00)
        }
      }

      const rows = csvText.split('\n')
      if (rows.length < 2) {
        return e.json(200, { imported: 0 })
      }

      const headersLine = rows[0].replace(/"/g, '').replace(/\r/g, '')
      const headers = headersLine.split(',')
      const cleanHeaders = headers.map((h) => h.trim().toLowerCase())

      const dateIdx = cleanHeaders.findIndex((h) => h === 'data')
      const typeIdx = cleanHeaders.findIndex((h) => h === 'tipo')
      const inPersonIdx = cleanHeaders.findIndex((h) => h === 'presenciais' || h === 'presencial')
      const zoomIdx = cleanHeaders.findIndex((h) => h === 'zoom')

      if (dateIdx === -1 || typeIdx === -1 || inPersonIdx === -1 || zoomIdx === -1) {
        return e.badRequestError(
          'Colunas necessárias (Data, Tipo, Presenciais, Zoom) não encontradas na planilha.',
        )
      }

      const attendanceMap = new Map()
      const errors = []
      let ignoredCount = 0

      for (let j = 1; j < rows.length; j++) {
        const rowStr = rows[j].trim()
        if (!rowStr) continue

        let cols = []
        let inQuotes = false
        let currentVal = ''
        for (let c = 0; c < rowStr.length; c++) {
          const char = rowStr[c]
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            cols.push(currentVal.trim())
            currentVal = ''
          } else {
            currentVal += char
          }
        }
        cols.push(currentVal.trim())

        const isColsEmpty = cols.every(c => !c.replace(/"/g, '').trim())
        if (isColsEmpty) continue

        if (cols.length <= Math.max(dateIdx, typeIdx, inPersonIdx, zoomIdx)) {
          ignoredCount++
          continue
        }

        const dateStr = cols[dateIdx] ? cols[dateIdx].replace(/"/g, '').trim() : ''
        const rawTypeStr = cols[typeIdx] ? cols[typeIdx].replace(/"/g, '').trim().toLowerCase() : ''

        if (!dateStr && !rawTypeStr) {
          continue
        }

        const inPersonStr = cols[inPersonIdx] ? cols[inPersonIdx].replace(/"/g, '').trim() : ''
        const zoomStr = cols[zoomIdx] ? cols[zoomIdx].replace(/"/g, '').trim() : ''

        if (!dateStr) {
          errors.push(`Linha ${j + 1}: Data ausente.`)
          ignoredCount++
          continue
        }

        if (!inPersonStr && inPersonStr !== '0') {
          errors.push(`Linha ${j + 1}: Valor 'presenciais' ausente.`)
          ignoredCount++
          continue
        }

        if (!zoomStr && zoomStr !== '0') {
          errors.push(`Linha ${j + 1}: Valor 'zoom' ausente.`)
          ignoredCount++
          continue
        }

        const inPerson = parseInt(inPersonStr, 10)
        const zoom = parseInt(zoomStr, 10)

        if (isNaN(inPerson) || isNaN(zoom)) {
          errors.push(`Linha ${j + 1}: Valores de presença inválidos.`)
          ignoredCount++
          continue
        }

        let typeStr = ''
        if (
          rawTypeStr.includes('vida e') ||
          rawTypeStr.includes('ministério') ||
          rawTypeStr === 'quinta'
        ) {
          typeStr = 'quinta'
        } else if (rawTypeStr.includes('fim de semana') || rawTypeStr === 'domingo') {
          typeStr = 'domingo'
        }

        if (!typeStr) {
          errors.push(`Linha ${j + 1}: Tipo de reunião inválido ("${rawTypeStr}").`)
          ignoredCount++
          continue
        }

        const dateParts = dateStr.split('/')
        if (dateParts.length !== 3) {
          errors.push(
            `Linha ${j + 1}: Formato de data inválido ("${dateStr}"). Esperado DD/MM/YYYY.`,
          )
          ignoredCount++
          continue
        }

        // Correct year typo (e.g. 0026 -> 2026, 0025 -> 2025)
        if (dateParts[2] === '0026') {
          dateParts[2] = '2026'
        } else if (dateParts[2] === '0025') {
          dateParts[2] = '2025'
        }

        const rowDate = new Date(
          dateParts[2] + '-' + dateParts[1] + '-' + dateParts[0] + 'T12:00:00Z',
        )
        if (isNaN(rowDate.getTime())) {
          errors.push(`Linha ${j + 1}: Data inválida ("${dateStr}").`)
          ignoredCount++
          continue
        }

        const isoDateStr = rowDate.toISOString().split('T')[0] + ' 12:00:00.000Z'
        const startStr = isoDateStr.substring(0, 10) + ' 00:00:00.000Z'
        const endStr = isoDateStr.substring(0, 10) + ' 23:59:59.000Z'

        const key = startStr + '|' + typeStr
        const total = inPerson + zoom

        if (!attendanceMap.has(key) || attendanceMap.get(key).total < total) {
          attendanceMap.set(key, { inPerson, zoom, total, isoDateStr, startStr, endStr, typeStr })
        }
      }

      let importedCount = 0
      const collection = $app.findCollectionByNameOrId('meeting_attendance')

      $app.runInTransaction((txApp) => {
        for (const data of attendanceMap.values()) {
          let existingRecord = null
          try {
            existingRecord = txApp.findFirstRecordByFilter(
              'meeting_attendance',
              'meeting_date >= {:start} && meeting_date <= {:end} && meeting_type = {:type}',
              {
                start: data.startStr,
                end: data.endStr,
                type: data.typeStr,
              },
            )
          } catch (err) {
            existingRecord = null
          }

          if (existingRecord) {
            const existingTotal = existingRecord.getInt('in_person') + existingRecord.getInt('zoom')
            if (data.total > existingTotal) {
              existingRecord.set('in_person', data.inPerson)
              existingRecord.set('zoom', data.zoom)
              txApp.save(existingRecord)
              importedCount++
            }
          } else {
            const record = new Record(collection)
            record.set('meeting_date', data.isoDateStr)
            record.set('meeting_type', data.typeStr)
            record.set('in_person', data.inPerson)
            record.set('zoom', data.zoom)
            txApp.save(record)
            importedCount++
          }
        }
      })

      return e.json(200, {
        imported: importedCount,
        ignored: ignoredCount,
        errors: errors,
      })
    } catch (err) {
      return e.badRequestError('Erro inesperado durante a sincronização dos dados: ' + err.message)
    }
  },
  $apis.requireAuth(),
)
