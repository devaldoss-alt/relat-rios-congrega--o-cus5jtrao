import pb from '@/lib/pocketbase/client'

export interface S10Report {
  id?: string
  service_year: number
  avg_attendance_weekend?: number
  avg_attendance_midweek?: number
  total_active_publishers?: number
  new_unbaptized_publishers?: number
  reactivated_publishers?: number
  deaf_publishers?: number
  blind_publishers?: number
  prisoner_publishers?: number
  territory_cards_worked?: number
  territory_percent_covered?: number
  notes?: string
  updated_by?: string
  created?: string
  updated?: string
}

export interface S10Territory {
  id?: string
  number: string
  name?: string
  service_year?: number
  work_date?: string
  coverage_percent?: number
  status?: string
  notes?: string
  created?: string
  updated?: string
}

export const getS10ReportByServiceYear = async (serviceYear: number): Promise<S10Report | null> => {
  try {
    return await pb
      .collection('s10_reports')
      .getFirstListItem<S10Report>(`service_year = ${serviceYear}`)
  } catch (err: any) {
    if (err?.status === 404) return null
    throw err
  }
}

export const saveS10Report = async (data: Partial<S10Report>): Promise<S10Report> => {
  if (data.id) {
    return await pb.collection('s10_reports').update<S10Report>(data.id, data)
  }
  // Se não tem ID, verifica se já existe registro com esse service_year para evitar erro de UNIQUE
  if (data.service_year) {
    const existing = await getS10ReportByServiceYear(data.service_year)
    if (existing?.id) {
      return await pb.collection('s10_reports').update<S10Report>(existing.id, data)
    }
  }
  return await pb.collection('s10_reports').create<S10Report>(data)
}

export const getS10Territories = async (serviceYear?: number): Promise<S10Territory[]> => {
  const filter = serviceYear ? `service_year = ${serviceYear}` : ''
  return await pb.collection('s10_territories').getFullList<S10Territory>({
    filter,
    sort: '+number',
  })
}

export interface S10CalculatedData {
  avgAttendanceWeekend: number
  avgAttendanceMidweek: number
  totalActivePublishersAugust: number
  augustSummaryFound: boolean
  totalWeekendMeetings: number
  totalMidweekMeetings: number
  // Novos cálculos automáticos conforme o conceito confirmado:
  autoReadmittedCount: number
  readmittedPublishersList: { id: string; name: string; date: string }[]
  autoNewUnbaptizedCount: number
  newUnbaptizedPublishersList: { id: string; name: string; firstMonth: string; firstYear: number }[]
  autoReactivatedCount: number
  reactivatedPublishersList: {
    id: string
    name: string
    resumedMonth: string
    resumedYear: number
  }[]
}

/**
 * Retorna se uma data YYYY-MM-DD cai no período do Ano de Serviço (01/09/startYear a 31/08/endYear)
 */
function isDateInServiceYear(
  dateStr: string | undefined | null,
  startYear: number,
  endYear: number,
): boolean {
  if (!dateStr) return false
  const dateOnly = dateStr.slice(0, 10) // 'YYYY-MM-DD'
  const startLimit = `${startYear}-09-01`
  const endLimit = `${endYear}-08-31`
  return dateOnly >= startLimit && dateOnly <= endLimit
}

/**
 * Converte mês/ano em número ordinal contínuo para comparações temporais
 */
function toMonthIndex(year: number, month: number): number {
  return year * 12 + (month - 1)
}

/**
 * Calcula os dados consolidados do Ano de Serviço (setembro a agosto):
 * 1. Médias de assistência às reuniões (Fim de semana e Meio de semana) ao longo de todo o ano de serviço
 *    a partir de meeting_attendance.
 * 2. Total de publicadores ativos = FOTOGRAFIA DE AGOSTO (mês 08 do serviceYear),
 *    usando a regra consolidada (monthly_summaries ou fallback via computeFallbackData).
 *    Readmitidos no ano que estão ativos voltam a contar como ativos normalmente na fotografia.
 * 3. Readmitidos: contagem automática de publicadores cujo `readmission_date` cai no ano de serviço.
 * 4. Novos não batizados: primeiro relato no sistema cai no ano de serviço E sem batismo até aquele relato.
 * 5. Reativados no ano de serviço: publicadores (nunca Removidos) que ficaram 6+ meses sem relatar e retomaram no ano de serviço.
 */
export const calculateS10Data = async (serviceYear: number): Promise<S10CalculatedData> => {
  const startYear = serviceYear - 1
  const endYear = serviceYear

  // 1. Assistência às reuniões durante o ano de serviço: de 1 de setembro (startYear) a 31 de agosto (endYear)
  const startDateStr = `${startYear}-09-01 00:00:00`
  const endDateStr = `${endYear}-08-31 23:59:59`

  const [attendanceList, allPublishers, allReports] = await Promise.all([
    pb
      .collection('meeting_attendance')
      .getFullList({
        filter: `meeting_date >= '${startDateStr}' && meeting_date <= '${endDateStr}'`,
        sort: '+meeting_date',
      })
      .catch(() => []),
    pb
      .collection('publishers')
      .getFullList()
      .catch(() => []),
    pb
      .collection('publisher_reports')
      .getFullList({
        sort: '+year,+month',
      })
      .catch(() => []),
  ])

  let mwSum = 0
  let mwCount = 0
  let weSum = 0
  let weCount = 0

  for (const item of attendanceList) {
    const total = (Number(item.in_person) || 0) + (Number(item.zoom) || 0)
    if (item.meeting_type === 'quinta') {
      mwSum += total
      mwCount++
    } else {
      weSum += total
      weCount++
    }
  }

  const avgAttendanceMidweek = mwCount > 0 ? Math.round(mwSum / mwCount) : 0
  const avgAttendanceWeekend = weCount > 0 ? Math.round(weSum / weCount) : 0

  // 2. Readmitidos no Ano de Serviço:
  // Publicadores cujo readmission_date cai entre 01/09/(serviceYear-1) e 31/08/serviceYear
  const readmittedPublishersList: { id: string; name: string; date: string }[] = []
  for (const pub of allPublishers) {
    if (pub.readmission_date && isDateInServiceYear(pub.readmission_date, startYear, endYear)) {
      readmittedPublishersList.push({
        id: pub.id,
        name: pub.name,
        date: pub.readmission_date.slice(0, 10),
      })
    }
  }
  const autoReadmittedCount = readmittedPublishersList.length

  // 3. Fotografia de agosto do ano de serviço
  let totalActivePublishersAugust = 0
  let augustSummaryFound = false

  // Tenta buscar no monthly_summaries de agosto do endYear
  const augustSummary = await pb
    .collection('monthly_summaries')
    .getFirstListItem(`year = ${endYear} && (month = '08' || month = '8')`)
    .catch(() => null)

  if (augustSummary && Number(augustSummary.total_active_publishers) > 0) {
    totalActivePublishersAugust = Number(augustSummary.total_active_publishers)
    augustSummaryFound = true
  } else {
    // Se não encontrou ou está zerado, calcula usando a regra consolidada de atividade de agosto
    // Pegando os relatórios dos 6 meses anteriores a agosto (março a agosto de endYear)
    try {
      const { getPublisherReportsFor6Months, calculateActivityStatus } =
        await import('./publisher_reports')
      const pubReports6m = await getPublisherReportsFor6Months(8, endYear)

      let activeCount = 0
      for (const pub of allPublishers) {
        // Removido ou Mudou-se saem da contagem.
        // SE o publicador foi readmitido no ano de serviço e seu status atual é Ativo / Inativo (Apoio),
        // ele participa normalmente da contagem.
        const isArchived = pub.status === 'Mudou-se' || pub.status === 'Removido'
        if (isArchived) continue

        const status = calculateActivityStatus(pub.id, pubReports6m as any, 8, endYear)
        if (status !== 'Inativo') {
          activeCount++
        }
      }
      totalActivePublishersAugust = activeCount
    } catch (e) {
      console.error('Erro ao calcular fotografia de agosto para o S-10:', e)
    }
  }

  // 4. Novos publicadores não batizados e Reativados a partir do histórico de publisher_reports
  // Mapeamos os relatórios válidos (participou = true OU hours > 0) por publicador
  const reportsByPublisher = new Map<
    string,
    Array<{ month: number; year: number; monthIdx: number }>
  >()
  for (const rep of allReports) {
    const didParticipate = rep.participated || Number(rep.hours) > 0
    if (!didParticipate) continue

    const m = parseInt(rep.month, 10)
    const y = Number(rep.year)
    if (!m || !y) continue

    const pubId = rep.publisher_id
    if (!pubId) continue

    if (!reportsByPublisher.has(pubId)) {
      reportsByPublisher.set(pubId, [])
    }
    reportsByPublisher.get(pubId)!.push({
      month: m,
      year: y,
      monthIdx: toMonthIndex(y, m),
    })
  }

  // Ordena a linha do tempo de cada publicador
  for (const [, list] of reportsByPublisher.entries()) {
    list.sort((a, b) => a.monthIdx - b.monthIdx)
  }

  const syStartIdx = toMonthIndex(startYear, 9) // Setembro do startYear
  const syEndIdx = toMonthIndex(endYear, 8) // Agosto do endYear

  const newUnbaptizedPublishersList: {
    id: string
    name: string
    firstMonth: string
    firstYear: number
  }[] = []
  const reactivatedPublishersList: {
    id: string
    name: string
    resumedMonth: string
    resumedYear: number
  }[] = []

  for (const pub of allPublishers) {
    const list = reportsByPublisher.get(pub.id)
    if (!list || list.length === 0) continue

    // 4.1 Novos não batizados:
    // Primeiro relato no sistema cai dentro do ano de serviço selecionado
    // E sem batismo até o primeiro relato (ou seja: baptism_date vazio OU data de batismo posterior ao primeiro relato)
    const firstReport = list[0]
    if (firstReport.monthIdx >= syStartIdx && firstReport.monthIdx <= syEndIdx) {
      let isUnbaptizedAtFirstReport = false
      if (!pub.baptism_date) {
        isUnbaptizedAtFirstReport = true
      } else {
        const baptismDateOnly = pub.baptism_date.slice(0, 10)
        // Primeiro mês do relato formatado 'YYYY-MM-01'
        const firstReportMonthStr = `${firstReport.year}-${String(firstReport.month).padStart(2, '0')}-01`
        if (baptismDateOnly > firstReportMonthStr) {
          isUnbaptizedAtFirstReport = true
        }
      }

      if (isUnbaptizedAtFirstReport) {
        newUnbaptizedPublishersList.push({
          id: pub.id,
          name: pub.name,
          firstMonth: String(firstReport.month).padStart(2, '0'),
          firstYear: firstReport.year,
        })
      }
    }

    // 4.2 Reativados no ano de serviço:
    // Inativos (6+ meses consecutivos sem relatar) que retomaram dentro do ano de serviço.
    // NUNCA desassociados/removidos: status nunca 'Removido', e sem readmission_date.
    if (pub.status === 'Removido' || pub.readmission_date) {
      continue
    }

    // Procurar um gap de 7+ meses entre relatos consecutivos (ou seja, 6 ou mais meses sem relatar:
    // ex: relatou em jan (idx 0), próximo relato em ago (idx 7) => 7 - 0 = 7 => 6 meses sem relato: fev, mar, abr, mai, jun, jul)
    // Se o relato da retomada cair dentro do ano de serviço selecionado [syStartIdx, syEndIdx], conta como reativado.
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1]
      const curr = list[i]
      const gapMonths = curr.monthIdx - prev.monthIdx // se gap >= 7, foram pelo menos 6 meses sem relatar
      if (gapMonths >= 7 && curr.monthIdx >= syStartIdx && curr.monthIdx <= syEndIdx) {
        reactivatedPublishersList.push({
          id: pub.id,
          name: pub.name,
          resumedMonth: String(curr.month).padStart(2, '0'),
          resumedYear: curr.year,
        })
        break // Conta 1 vez por publicador no ano de serviço
      }
    }
  }

  return {
    avgAttendanceWeekend,
    avgAttendanceMidweek,
    totalActivePublishersAugust,
    augustSummaryFound,
    totalWeekendMeetings: weCount,
    totalMidweekMeetings: mwCount,
    autoReadmittedCount,
    readmittedPublishersList,
    autoNewUnbaptizedCount: newUnbaptizedPublishersList.length,
    newUnbaptizedPublishersList,
    autoReactivatedCount: reactivatedPublishersList.length,
    reactivatedPublishersList,
  }
}
