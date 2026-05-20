routerAdd(
  'POST',
  '/backend/v1/sync-attendance',
  async (e) => {
    const authRole = e.auth?.getString('role')
    if (authRole !== 'Secretário') {
      return e.forbiddenError('Apenas o Secretário pode sincronizar')
    }

    try {
      const url =
        'https://docs.google.com/spreadsheets/d/1IDlk36sxh14G1vqrl-i8JltLVUjagmWpMiHHoZUgkN8/gviz/tq?tqx=out:csv&sheet=Assist%C3%AAncia%20%C3%A0s%20Reuni%C3%B5es'

      const res = await fetch(url)

      if (!res.ok) {
        return e.badRequestError(
          'Falha ao buscar dados do Google Sheets. A planilha pode estar indisponível.',
        )
      }

      const csvText = await res.text()

      const rows = csvText.split('\n')
      if (rows.length < 2) {
        return e.json(200, { imported: 0, ignored: 0, errors: [] })
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

        const isColsEmpty = cols.every((c) => !c.replace(/"/g, '').trim())
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

        if (inPersonStr === '' && zoomStr === '') {
          errors.push(`Linha ${j + 1}: Valores de presença ausentes.`)
          ignoredCount++
          continue
        }

        const inPerson = inPersonStr !== '' ? parseInt(inPersonStr, 10) : 0
        const zoom = zoomStr !== '' ? parseInt(zoomStr, 10) : 0

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

        if (dateParts[2].startsWith('00')) {
          dateParts[2] = '20' + dateParts[2].substring(2)
        } else if (dateParts[2].length === 2) {
          dateParts[2] = '20' + dateParts[2]
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
          attendanceMap.set(key, {
            inPerson,
            zoom,
            total,
            isoDateStr,
            startStr,
            endStr,
            typeStr,
            originalDate: dateStr,
          })
        }
      }

      let importedCount = 0
      const collection = $app.findCollectionByNameOrId('meeting_attendance')

      for (const data of attendanceMap.values()) {
        let existingRecord = null
        try {
          existingRecord = $app.findFirstRecordByFilter(
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

        try {
          if (existingRecord) {
            const existingTotal = existingRecord.getInt('in_person') + existingRecord.getInt('zoom')
            if (data.total > existingTotal) {
              existingRecord.set('in_person', data.inPerson)
              existingRecord.set('zoom', data.zoom)
              $app.save(existingRecord)
              importedCount++
            }
          } else {
            const record = new Record(collection)
            record.set('meeting_date', data.isoDateStr)
            record.set('meeting_type', data.typeStr)
            record.set('in_person', data.inPerson)
            record.set('zoom', data.zoom)
            $app.save(record)
            importedCount++
          }
        } catch (saveErr) {
          errors.push(
            `Erro ao salvar reunião de ${data.originalDate}: ${saveErr.message || 'Falha de validação'}`,
          )
          ignoredCount++
        }
      }

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
