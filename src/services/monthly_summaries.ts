import pb from '@/lib/pocketbase/client'

export interface MonthlySummary {
  id: string
  month: string
  year: number
  total_active_publishers: number
  avg_attendance_midweek: number
  avg_attendance_weekend: number
  attendance_goal?: number
  report_data: any
  created: string
  updated: string
}

export const computeFallbackData = async (month: string, year: number) => {
  const mStr = month.toString().padStart(2, '0')

  const pubReports = await pb.collection('publisher_reports').getFullList({
    filter: `month = '${mStr}' && year = ${year}`,
  })

  const attendance = await pb.collection('meeting_attendance').getFullList({
    filter: `meeting_date >= '${year}-${mStr}-01 00:00:00' && meeting_date <= '${year}-${mStr}-31 23:59:59'`,
  })

  let totalActive = 0
  const report_data = {
    publishers: { reports: 0, hours: 0, studies: 0 },
    auxiliary: { reports: 0, hours: 0, studies: 0 },
    regular: { reports: 0, hours: 0, studies: 0 },
  }

  for (const r of pubReports) {
    const type = r.type || 'publicador'
    const didParticipate = r.participated || (r.hours && r.hours > 0)

    if (didParticipate) {
      totalActive++
      if (type === 'pioneiro_regular') {
        report_data.regular.reports++
        report_data.regular.hours += r.hours || 0
        report_data.regular.studies += r.bible_studies || 0
      } else if (type === 'pioneiro_auxiliar') {
        report_data.auxiliary.reports++
        report_data.auxiliary.hours += r.hours || 0
        report_data.auxiliary.studies += r.bible_studies || 0
      } else {
        report_data.publishers.reports++
        report_data.publishers.hours += r.hours || 0
        report_data.publishers.studies += r.bible_studies || 0
      }
    }
  }

  let mwSum = 0,
    mwCount = 0
  let weSum = 0,
    weCount = 0

  for (const a of attendance) {
    const total = (a.in_person || 0) + (a.zoom || 0)
    if (a.meeting_type === 'quinta') {
      mwSum += total
      mwCount++
    } else {
      weSum += total
      weCount++
    }
  }

  return {
    total_active_publishers: totalActive,
    avg_attendance_midweek: mwCount > 0 ? Math.round(mwSum / mwCount) : 0,
    avg_attendance_weekend: weCount > 0 ? Math.round(weSum / weCount) : 0,
    report_data,
  }
}

export const getMonthlySummaries = async () => {
  const summaries = await pb
    .collection('monthly_summaries')
    .getFullList<MonthlySummary>({ sort: '-year,-month' })
  return Promise.all(
    summaries.map(async (summary) => {
      if (!summary.total_active_publishers || summary.total_active_publishers === 0) {
        try {
          const fallback = await computeFallbackData(summary.month, summary.year)
          return { ...summary, ...fallback }
        } catch {
          return summary
        }
      }
      return summary
    }),
  )
}

export const getMonthlySummary = async (id: string) => {
  const summary = await pb.collection('monthly_summaries').getOne<MonthlySummary>(id)
  if (!summary.total_active_publishers || summary.total_active_publishers === 0) {
    try {
      const fallback = await computeFallbackData(summary.month, summary.year)
      return { ...summary, ...fallback }
    } catch {
      return summary
    }
  }
  return summary
}

export const createMonthlySummary = (data: Partial<MonthlySummary>) => {
  if (data.month) data.month = data.month.toString().padStart(2, '0')
  return pb.collection('monthly_summaries').create<MonthlySummary>(data)
}

export const updateMonthlySummary = (id: string, data: Partial<MonthlySummary>) => {
  if (data.month) data.month = data.month.toString().padStart(2, '0')
  return pb.collection('monthly_summaries').update<MonthlySummary>(id, data)
}

export const findMonthlySummary = async (year: number, month: string | number) => {
  const m = month.toString().padStart(2, '0')
  const rawM = month.toString()
  const summary = await pb
    .collection('monthly_summaries')
    .getFirstListItem<MonthlySummary>(`year = ${year} && (month = '${m}' || month = '${rawM}')`)
    .catch(() => null)

  if (summary && (!summary.total_active_publishers || summary.total_active_publishers === 0)) {
    try {
      const fallback = await computeFallbackData(m, year)
      return { ...summary, ...fallback }
    } catch {
      return summary
    }
  }
  return summary
}
