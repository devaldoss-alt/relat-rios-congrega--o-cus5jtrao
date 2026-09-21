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
}

/**
 * Calcula os dados consolidados do Ano de Serviço (setembro a agosto):
 * 1. Médias de assistência às reuniões (Fim de semana e Meio de semana) ao longo de todo o ano de serviço
 *    a partir de meeting_attendance.
 * 2. Total de publicadores ativos = FOTOGRAFIA DE AGOSTO (mês 08 do serviceYear),
 *    usando a regra consolidada (monthly_summaries ou fallback via computeFallbackData).
 */
export const calculateS10Data = async (serviceYear: number): Promise<S10CalculatedData> => {
  const startYear = serviceYear - 1
  const endYear = serviceYear

  // 1. Assistência às reuniões durante o ano de serviço: de 1 de setembro (startYear) a 31 de agosto (endYear)
  const startDateStr = `${startYear}-09-01 00:00:00`
  const endDateStr = `${endYear}-08-31 23:59:59`

  const attendanceList = await pb.collection('meeting_attendance').getFullList({
    filter: `meeting_date >= '${startDateStr}' && meeting_date <= '${endDateStr}'`,
    sort: '+meeting_date',
  })

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

  // 2. Fotografia de agosto do ano de serviço
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
      const publishers = await pb.collection('publishers').getFullList()

      let activeCount = 0
      for (const pub of publishers) {
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

  return {
    avgAttendanceWeekend,
    avgAttendanceMidweek,
    totalActivePublishersAugust,
    augustSummaryFound,
    totalWeekendMeetings: weCount,
    totalMidweekMeetings: mwCount,
  }
}
