import pb from '@/lib/pocketbase/client'
import { calculateActivityStatus } from './publisher_reports'

export const getCompilationData = async (year: number, month: number) => {
  const monthPaddedStr = month < 10 ? `0${month}` : `${month}`

  // 1. Fetch publishers (so we can count them even if they have NO reports this month)
  const publishers = await pb.collection('publishers').getFullList({
    expand: 'group_id',
  })

  // 2. Fetch reports for the past 6 months (last 2 years is safe enough)
  const reports = await pb.collection('publisher_reports').getFullList({
    filter: `year = ${year} || year = ${year - 1}`,
    expand: 'publisher_id,publisher_id.group_id',
  })

  // 3. Fetch groups to initialize group data
  const groups = await pb.collection('groups').getFullList()

  // 4. Initialize in-memory aggregation map
  const groupReportsMap = new Map()
  for (const g of groups) {
    groupReportsMap.set(g.id, {
      group_id: g.id,
      month: `${year}-${monthPaddedStr}`,
      publishers_count: 0,
      auxiliary_pioneers_count: 0,
      regular_pioneers_count: 0,
      publisher_hours: 0,
      auxiliary_pioneer_hours: 0,
      regular_pioneer_hours: 0,
      publisher_bible_studies: 0,
      auxiliary_pioneer_bible_studies: 0,
      regular_pioneer_bible_studies: 0,
    })
  }

  // 5. Aggregate data using 6-month rule
  for (const pub of publishers) {
    const isArchived = pub.status === 'Mudou-se' || pub.status === 'Removido'
    const isLegacyInactive = !pub.active && !pub.status

    if (isArchived || isLegacyInactive) {
      continue
    }

    const currentMonthReport = reports.find(
      (r) => r.publisher_id === pub.id && r.month === monthPaddedStr && r.year === year,
    )

    const gid = pub.group_id
    if (!groupReportsMap.has(gid)) continue
    const gRep = groupReportsMap.get(gid)

    const status = calculateActivityStatus(pub.id, reports as any, month, year)

    // Type comes from current report or publisher's current type
    const type = currentMonthReport?.type || pub.type

    // Included if Ativo or Não Participou (Irregular but active in 6 months)
    const isCounted = status !== 'Inativo'

    if (type === 'pioneiro_regular') {
      if (isCounted) gRep.regular_pioneers_count++
      if (currentMonthReport && (currentMonthReport.hours || currentMonthReport.participated)) {
        gRep.regular_pioneer_hours += currentMonthReport.hours || 0
        gRep.regular_pioneer_bible_studies += currentMonthReport.bible_studies || 0
      }
    } else if (type === 'pioneiro_auxiliar') {
      if (isCounted) gRep.auxiliary_pioneers_count++
      if (currentMonthReport && (currentMonthReport.hours || currentMonthReport.participated)) {
        gRep.auxiliary_pioneer_hours += currentMonthReport.hours || 0
        gRep.auxiliary_pioneer_bible_studies += currentMonthReport.bible_studies || 0
      }
    } else {
      if (isCounted) gRep.publishers_count++
      if (currentMonthReport && (currentMonthReport.hours || currentMonthReport.participated)) {
        gRep.publisher_hours += currentMonthReport.hours || 0
        gRep.publisher_bible_studies += currentMonthReport.bible_studies || 0
      }
    }
  }

  const groupReports = Array.from(groupReportsMap.values())

  // 6. Fetch attendance
  const startStr = `${year}-${month.toString().padStart(2, '0')}-01 00:00:00.000Z`
  const nextYear = month === 12 ? year + 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const endStr = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01 00:00:00.000Z`

  const meetings = await pb.collection('meeting_attendance').getFullList({
    filter: `meeting_date >= "${startStr}" && meeting_date < "${endStr}"`,
  })

  return { groupReports, meetings }
}
