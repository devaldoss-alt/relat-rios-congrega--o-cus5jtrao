import pb from '@/lib/pocketbase/client'

export const getCompilationData = async (year: number, month: number) => {
  const monthPaddedStr = month < 10 ? `0${month}` : `${month}`

  // 1. Fetch raw publisher reports for the month
  const pubReports = await pb.collection('publisher_reports').getFullList({
    filter: `month="${monthPaddedStr}" && year=${year}`,
    expand: 'publisher_id,publisher_id.group_id',
  })

  // 2. Fetch groups to initialize group data
  const groups = await pb.collection('groups').getFullList()

  // 3. Initialize in-memory aggregation map
  const groupReportsMap = new Map()
  for (const g of groups) {
    groupReportsMap.set(g.id, {
      group_id: g.id,
      month: `${year}-${month.toString().padStart(2, '0')}`,
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

  // 4. Aggregate data from publisher reports into group reports
  for (const r of pubReports) {
    const pub = r.expand?.publisher_id
    if (!pub) continue
    const gid = pub.group_id
    if (!groupReportsMap.has(gid)) continue

    const gRep = groupReportsMap.get(gid)
    const type = r.type || pub.type

    if (type === 'pioneiro_regular') {
      if (r.participated || r.hours > 0) gRep.regular_pioneers_count++
      gRep.regular_pioneer_hours += r.hours || 0
      gRep.regular_pioneer_bible_studies += r.bible_studies || 0
    } else if (type === 'pioneiro_auxiliar') {
      if (r.participated || r.hours > 0) gRep.auxiliary_pioneers_count++
      gRep.auxiliary_pioneer_hours += r.hours || 0
      gRep.auxiliary_pioneer_bible_studies += r.bible_studies || 0
    } else {
      if (r.participated || r.hours > 0) gRep.publishers_count++
      gRep.publisher_hours += r.hours || 0
      gRep.publisher_bible_studies += r.bible_studies || 0
    }
  }

  const groupReports = Array.from(groupReportsMap.values())

  // 5. Fetch attendance
  const startStr = `${year}-${month.toString().padStart(2, '0')}-01 00:00:00.000Z`
  const nextYear = month === 12 ? year + 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const endStr = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01 00:00:00.000Z`

  const meetings = await pb.collection('meeting_attendance').getFullList({
    filter: `meeting_date >= "${startStr}" && meeting_date < "${endStr}"`,
  })

  return { groupReports, meetings }
}
